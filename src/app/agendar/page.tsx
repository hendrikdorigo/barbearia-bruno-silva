// @ts-nocheck
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, ScissorsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FORMAS_PAGAMENTO, TOLERANCIA_ATRASO_MINUTOS } from "@/lib/constants";
import { calcularSlotsLivresPorBarbeiro } from "@/lib/disponibilidade";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AgendamentoStepper from "@/components/AgendamentoStepper";
import SeletorDataFaixa from "@/components/SeletorDataFaixa";
import PixCheckout from "@/components/PixCheckout";
import ProdutoPicker from "@/components/ProdutoPicker";
import PerguntaFrequencia from "@/components/PerguntaFrequencia";
import { type Produto, type Carrinho, itensCarrinho, totalCarrinho, salvarProdutosNaComanda } from "@/lib/produtos-carrinho";

const PASSOS = [
  { id: "servico", label: "Serviço" },
  { id: "data", label: "Data" },
  { id: "horario", label: "Horário" },
  { id: "barbeiro", label: "Barbeiro" },
  { id: "produtos", label: "Produtos" },
  { id: "pagamento", label: "Pagamento" },
];

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };
type Candidato = { id: string; nome: string; avatarUrl: string | null; preco: number };
type Passo = "servico" | "data" | "horario" | "barbeiro" | "produtos" | "pagamento" | "confirmado";

export default function AgendarGeralPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">Carregando...</div>}
    >
      <AgendarConteudo />
    </Suspense>
  );
}

function AgendarConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicoPreSelecionadoId = searchParams.get("servico");
  const supabase = createClient();

  const [passo, setPasso] = useState<Passo>("servico");
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [buscandoCandidatos, setBuscandoCandidatos] = useState(false);

  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [slotsPorBarbeiro, setSlotsPorBarbeiro] = useState<Record<string, string[]>>({});
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<Candidato | null>(null);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Carrinho>({});

  const [ajustesAtivos, setAjustesAtivos] = useState<any[]>([]);
  const [descontoAntecipado, setDescontoAntecipado] = useState(0);
  const [exigePagamentoAntecipado, setExigePagamentoAntecipado] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [pagarAntecipado, setPagarAntecipado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoProdutos, setAvisoProdutos] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [agendamentoParaPagar, setAgendamentoParaPagar] = useState<string | null>(null);
  const [comandaIdParaPagar, setComandaIdParaPagar] = useState<string | null>(null);
  const [perguntarFrequencia, setPerguntarFrequencia] = useState(false);

  function alterarCarrinho(produtoId: string, delta: number) {
    setCarrinho((prev) => {
      const novo = Math.max(0, (prev[produtoId] ?? 0) + delta);
      const copia = { ...prev };
      if (novo === 0) delete copia[produtoId];
      else copia[produtoId] = novo;
      return copia;
    });
  }

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLogado(Boolean(user));
      setUserId(user?.id ?? null);

      const [{ data: servicosData }, { data: produtosData }, { data: configPagamento }] = await Promise.all([
        supabase.from("servicos").select("*").eq("ativo", true).order("preco"),
        supabase.from("produtos").select("id, nome, preco, categoria, imagem_url").eq("ativo", true).order("categoria"),
        supabase.from("configuracoes_pagamento").select("desconto_pagamento_antecipado_percentual").limit(1).maybeSingle(),
      ]);
      const lista = servicosData ?? [];
      setServicos(lista);
      setProdutos(produtosData ?? []);
      setDescontoAntecipado(Number(configPagamento?.desconto_pagamento_antecipado_percentual ?? 0));

      if (servicoPreSelecionadoId) {
        const preSelecionado = lista.find((s: any) => s.id === servicoPreSelecionadoId);
        if (preSelecionado) {
          setServicoSelecionado(preSelecionado);
          setPasso("data");
        }
      }

      if (user) {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("exige_pagamento_antecipado")
          .eq("profile_id", user.id)
          .maybeSingle();
        if ((cliente as any)?.exige_pagamento_antecipado) {
          setExigePagamentoAntecipado(true);
          setPagarAntecipado(true);
        }
      }

      setCarregando(false);
    }
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao escolher o serviço: descobre quais barbeiros ativos o oferecem (com
  // preço próprio, se houver). Sem nenhum configurado, qualquer barbeiro
  // ativo entra como candidato pelo preço padrão do serviço - mesmo
  // fallback que /agendar/[barbeiroId] já usa.
  useEffect(() => {
    async function buscarCandidatos() {
      if (!servicoSelecionado) return;
      setBuscandoCandidatos(true);

      const { data: barbeiroServicos } = await supabase
        .from("barbeiro_servicos")
        .select("barbeiro_id, preco_personalizado, ativo, barbeiros!inner(profile_id, ativo, profiles(nome, avatar_url))")
        .eq("servico_id", servicoSelecionado.id)
        .eq("ativo", true)
        .eq("barbeiros.ativo", true);

      let lista: Candidato[] = (barbeiroServicos ?? []).map((bs: any) => ({
        id: bs.barbeiro_id,
        nome: bs.barbeiros?.profiles?.nome ?? "",
        avatarUrl: bs.barbeiros?.profiles?.avatar_url ?? null,
        preco: bs.preco_personalizado ?? servicoSelecionado.preco,
      }));

      if (lista.length === 0) {
        const { data: todosBarbeiros } = await supabase
          .from("barbeiros")
          .select("profile_id, profiles(nome, avatar_url)")
          .eq("ativo", true);
        lista = (todosBarbeiros ?? []).map((b: any) => ({
          id: b.profile_id,
          nome: b.profiles?.nome ?? "",
          avatarUrl: b.profiles?.avatar_url ?? null,
          preco: servicoSelecionado.preco,
        }));
      }

      setCandidatos(lista);
      setBuscandoCandidatos(false);
    }
    buscarCandidatos();
  }, [servicoSelecionado, supabase]);

  // Ao escolher a data: calcula, em paralelo, os horários livres de cada
  // candidato e junta num único conjunto (união) para o passo "Horário".
  useEffect(() => {
    async function buscarHorarios() {
      if (candidatos.length === 0) {
        setSlotsPorBarbeiro({});
        return;
      }
      setBuscandoHorarios(true);
      const porBarbeiro = await calcularSlotsLivresPorBarbeiro(
        supabase,
        candidatos.map((c) => c.id),
        data
      );
      setSlotsPorBarbeiro(porBarbeiro);

      const diaSemana = new Date(`${data}T00:00:00`).getDay();
      const { data: ajustes } = await supabase
        .from("servico_ajustes")
        .select("*")
        .in(
          "barbeiro_id",
          candidatos.map((c) => c.id)
        )
        .eq("ativo", true);
      const aplicaveis = (ajustes ?? []).filter((a: any) => {
        const porData = (!a.data_inicio || a.data_inicio <= data) && (!a.data_fim || a.data_fim >= data);
        const porDiaSemana = a.dia_semana === null || a.dia_semana === diaSemana;
        return porData && porDiaSemana;
      });
      setAjustesAtivos(aplicaveis);

      setBuscandoHorarios(false);
    }
    if (data && passo !== "servico") buscarHorarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, candidatos]);

  const slotsUniao = useMemo(() => {
    const conjunto = new Set<string>();
    Object.values(slotsPorBarbeiro).forEach((slots) => slots.forEach((s) => conjunto.add(s)));
    return Array.from(conjunto).sort();
  }, [slotsPorBarbeiro]);

  const barbeirosLivresNoHorario = useMemo(() => {
    if (!horarioSelecionado) return [];
    return candidatos.filter((c) => (slotsPorBarbeiro[c.id] ?? []).includes(horarioSelecionado));
  }, [horarioSelecionado, candidatos, slotsPorBarbeiro]);

  function precoComAjuste(candidato: Candidato) {
    let preco = Number(candidato.preco);
    for (const a of ajustesAtivos) {
      if (a.barbeiro_id !== candidato.id) continue;
      if (a.servico_id && servicoSelecionado && a.servico_id !== servicoSelecionado.id) continue;
      const delta = a.valor_tipo === "percentual" ? (preco * Number(a.valor)) / 100 : Number(a.valor);
      preco += a.tipo === "desconto" ? -delta : delta;
    }
    return Math.max(0, Math.round(preco * 100) / 100);
  }

  const precoFinal = barbeiroSelecionado ? precoComAjuste(barbeiroSelecionado) : 0;
  const precoComDesconto =
    descontoAntecipado > 0
      ? Math.max(0, Math.round(precoFinal * (1 - descontoAntecipado / 100) * 100) / 100)
      : precoFinal;
  const pagaAntecipadoAgora = exigePagamentoAntecipado || pagarAntecipado;
  const precoServicoCobrado = pagaAntecipadoAgora ? precoComDesconto : precoFinal;
  const totalProdutos = totalCarrinho(carrinho, produtos);
  const valorTotal = precoServicoCobrado + totalProdutos;

  async function confirmarAgendamento() {
    setErro(null);
    setAvisoProdutos(null);
    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !servicoSelecionado || !horarioSelecionado || !barbeiroSelecionado) {
      setErro("Dados incompletos.");
      setEnviando(false);
      return;
    }

    const dataHoraISO = `${data}T${horarioSelecionado}:00`;
    const pagaAntecipado = exigePagamentoAntecipado || pagarAntecipado;

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: user.id,
        barbeiro_id: barbeiroSelecionado.id,
        servico_id: servicoSelecionado.id,
        data_hora: dataHoraISO,
        status: "pendente",
        forma_pagamento: (pagaAntecipado ? "pix" : formaPagamento) as any,
        pagamento_antecipado: false,
        valor_servico: pagaAntecipado ? precoComDesconto : precoFinal,
      })
      .select()
      .single();

    if (agendamentoError || !agendamento) {
      setErro(
        agendamentoError?.message ??
          "Não foi possível criar o agendamento. Talvez esse horário já tenha sido reservado - volte e escolha outro."
      );
      setEnviando(false);
      return;
    }

    fetch(`/api/agendamentos/${agendamento.id}/criar`, { method: "POST" }).catch(() => {});

    const { data: clienteFrequencia } = await supabase
      .from("clientes")
      .select("frequencia_dias")
      .eq("profile_id", user.id)
      .maybeSingle();
    setPerguntarFrequencia((clienteFrequencia as any)?.frequencia_dias == null);

    const { comandaId, erro: erroProdutos } = await salvarProdutosNaComanda(
      supabase,
      agendamento.id,
      carrinho,
      produtos
    );
    if (erroProdutos) setAvisoProdutos(erroProdutos);

    setEnviando(false);

    if (pagaAntecipado) {
      setAgendamentoParaPagar(agendamento.id);
      setComandaIdParaPagar(comandaId);
      return;
    }

    setPasso("confirmado");
  }

  if (carregando) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!logado) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-foreground">Faça login para agendar</h1>
        <p className="mt-4 text-muted-foreground">Você precisa de uma conta de cliente para marcar um horário.</p>
        <Button onClick={() => router.push("/login?next=/agendar")} className="mt-6 uppercase tracking-widest">
          Ir para login
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Agendar horário</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">
        {passo === "servico" && "Escolha o serviço"}
        {passo === "data" && "Escolha o dia"}
        {passo === "horario" && "Escolha o horário"}
        {passo === "barbeiro" && "Escolha o barbeiro"}
        {passo === "produtos" && "Quer levar algo da loja?"}
        {passo === "pagamento" && "Forma de pagamento"}
        {passo === "confirmado" && "Agendamento confirmado!"}
      </h1>

      <AgendamentoStepper passos={PASSOS} atual={passo} />

      {passo === "servico" && (
        <div className="mt-8 grid gap-3">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoSelecionado(s);
                setBarbeiroSelecionado(null);
                setHorarioSelecionado(null);
                setPasso("data");
              }}
              className="flex items-center justify-between rounded-xl border border-border bg-ink-soft px-5 py-4 text-left transition-colors hover:border-gold"
            >
              <div>
                <p className="font-semibold text-foreground">{s.nome}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {s.duracao_minutos} min
                </p>
              </div>
              <p className="font-mono text-2xl font-medium text-gold-gradient">
                R$ {Number(s.preco).toFixed(2).replace(".", ",")}
              </p>
            </button>
          ))}
        </div>
      )}

      {passo === "data" && (
        <div className="mt-8">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Data</label>
          <div className="mt-3">
            <SeletorDataFaixa
              value={data}
              onChange={(novaData) => {
                setData(novaData);
                setHorarioSelecionado(null);
                setBarbeiroSelecionado(null);
              }}
            />
          </div>
          <Button
            disabled={buscandoCandidatos}
            onClick={() => setPasso("horario")}
            className="mt-6 w-full uppercase tracking-widest"
          >
            Continuar
          </Button>
        </div>
      )}

      {passo === "horario" && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Horários com pelo menos um barbeiro livre nesse dia
          </p>
          {buscandoHorarios ? (
            <p className="mt-4 text-sm text-muted-foreground">Verificando disponibilidade...</p>
          ) : (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slotsUniao.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setHorarioSelecionado(s);
                    setPasso("barbeiro");
                  }}
                  className={`rounded-lg border px-2 py-2 text-sm ${
                    horarioSelecionado === s
                      ? "border-gold bg-gold-gradient font-bold text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  }`}
                >
                  {s}
                </button>
              ))}
              {slotsUniao.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  Nenhum barbeiro está livre nesse dia. Escolha outra data.
                </p>
              )}
            </div>
          )}

          <Alert className="mt-6 border-gold/40 bg-gold/10">
            <ClockIcon className="text-gold" />
            <AlertTitle className="uppercase tracking-wider text-gold">
              Tolerância de atraso: {TOLERANCIA_ATRASO_MINUTOS} minutos
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Chegando com mais de {TOLERANCIA_ATRASO_MINUTOS} minutos de atraso, seu
              agendamento será cancelado automaticamente e sua próxima marcação
              exigirá pagamento antecipado.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {passo === "barbeiro" && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            {servicoSelecionado?.nome} · {data} às {horarioSelecionado}
          </p>
          <div className="mt-4 grid gap-3">
            {barbeirosLivresNoHorario.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setBarbeiroSelecionado(c);
                  setPasso("produtos");
                }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-ink-soft px-5 py-4 text-left transition-colors hover:border-gold"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" />}
                    <AvatarFallback className="bg-gold-gradient font-display text-ink">
                      {c.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-foreground">{c.nome}</p>
                </div>
                <p className="font-mono text-xl font-medium text-gold-gradient">
                  R$ {precoComAjuste(c).toFixed(2).replace(".", ",")}
                </p>
              </button>
            ))}
            {barbeirosLivresNoHorario.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Esse horário não está mais disponível. Volte e escolha outro.
              </p>
            )}
          </div>
        </div>
      )}

      {passo === "produtos" && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Aproveite e leve pomada, bebida ou outro produto — soma tudo na mesma
            comanda do seu horário.
          </p>

          <ProdutoPicker produtos={produtos} carrinho={carrinho} onAlterar={alterarCarrinho} />

          {totalProdutos > 0 && (
            <p className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Produtos</span>
              <span className="font-mono font-semibold text-gold-gradient">
                R$ {totalProdutos.toFixed(2).replace(".", ",")}
              </span>
            </p>
          )}

          <Button onClick={() => setPasso("pagamento")} className="mt-6 w-full uppercase tracking-widest">
            {totalProdutos > 0 ? "Continuar" : "Pular, ir para pagamento"}
          </Button>
        </div>
      )}

      {passo === "pagamento" && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            {servicoSelecionado?.nome} com {barbeiroSelecionado?.nome} · {data} às {horarioSelecionado}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-gold-gradient">
            R$ {valorTotal.toFixed(2).replace(".", ",")}
            {totalProdutos > 0 && (
              <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                (serviço R$ {precoServicoCobrado.toFixed(2).replace(".", ",")} + produtos R${" "}
                {totalProdutos.toFixed(2).replace(".", ",")})
              </span>
            )}
          </p>

          {!exigePagamentoAntecipado && (
            <>
              <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
                Quando você prefere pagar?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPagarAntecipado(false)}
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                    !pagarAntecipado
                      ? "border-gold bg-gold-gradient text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  }`}
                >
                  Pagar no local
                </button>
                <button
                  onClick={() => {
                    setPagarAntecipado(true);
                    setFormaPagamento("pix");
                  }}
                  className={`relative rounded-lg border px-4 py-3 text-sm font-semibold ${
                    pagarAntecipado
                      ? "border-gold bg-gold-gradient text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  }`}
                >
                  Pagar agora (Pix)
                  {descontoAntecipado > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        pagarAntecipado ? "bg-ink/20 text-ink" : "bg-success/15 text-success"
                      }`}
                    >
                      -{descontoAntecipado}%
                    </span>
                  )}
                </button>
              </div>
              {descontoAntecipado > 0 && !pagarAntecipado && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pagando agora, o serviço sai por R$ {precoComDesconto.toFixed(2).replace(".", ",")} em vez de
                  R$ {precoFinal.toFixed(2).replace(".", ",")}.
                </p>
              )}
            </>
          )}

          {exigePagamentoAntecipado || pagarAntecipado ? (
            <Alert className="mt-6 border-gold/40 bg-gold/10">
              <AlertDescription className="text-foreground/90">
                Pagamento antecipado é feito só via <strong>Pix</strong> - depois de
                confirmar, um QR Code aparece na tela para você escanear ou copiar o código.
                {descontoAntecipado > 0 && (
                  <>
                    {" "}
                    Já está com <strong>{descontoAntecipado}% de desconto</strong> aplicado no serviço.
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
                Forma de pagamento (no local)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {FORMAS_PAGAMENTO.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormaPagamento(f.id)}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      formaPagamento === f.id
                        ? "border-gold bg-gold-gradient font-bold text-ink"
                        : "border-border text-muted-foreground hover:border-gold"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {exigePagamentoAntecipado && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>
                Devido a um cancelamento por atraso anterior, esta marcação exige
                pagamento antecipado obrigatório.
              </AlertDescription>
            </Alert>
          )}

          {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}

          <Button
            disabled={enviando}
            onClick={confirmarAgendamento}
            className="mt-6 w-full uppercase tracking-widest"
          >
            {enviando
              ? "Confirmando..."
              : exigePagamentoAntecipado || pagarAntecipado
                ? "Gerar Pix"
                : "Confirmar agendamento"}
          </Button>
        </div>
      )}

      <PixCheckout
        open={Boolean(agendamentoParaPagar)}
        onClose={() => setAgendamentoParaPagar(null)}
        criarEndpoint={
          comandaIdParaPagar
            ? "/api/pagamentos/mercadopago/criar-pix-comanda"
            : "/api/pagamentos/mercadopago/criar-pix"
        }
        corpo={comandaIdParaPagar ? { comandaId: comandaIdParaPagar } : { agendamentoId: agendamentoParaPagar }}
        valor={valorTotal}
        onConfirmado={() => {
          setPasso("confirmado");
          setAgendamentoParaPagar(null);
          setComandaIdParaPagar(null);
        }}
      />

      {passo === "confirmado" && (
        <>
          <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
            <ScissorsIcon className="mx-auto size-8 text-gold" />
            <p className="mt-3 font-display text-3xl text-foreground">Tudo certo!</p>
            <p className="mt-3 text-muted-foreground">
              Seu horário com {barbeiroSelecionado?.nome} em {data} às {horarioSelecionado} foi
              registrado. Você vai receber um lembrete por WhatsApp 1 hora antes.
            </p>
            {itensCarrinho(carrinho, produtos).length > 0 && (
              <p className="mt-3 text-sm text-gold">
                Também vai levar:{" "}
                {itensCarrinho(carrinho, produtos)
                  .map((i) => `${i.quantidade}x ${i.produto.nome}`)
                  .join(", ")}
              </p>
            )}
            {avisoProdutos && <p className="mt-3 text-sm text-destructive">{avisoProdutos}</p>}
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>
                Lembrete: tolerância de atraso de {TOLERANCIA_ATRASO_MINUTOS} minutos.
                Após esse tempo o horário será cancelado.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/painel/cliente")} className="mt-6 uppercase tracking-widest">
              Ver meus agendamentos
            </Button>
          </div>

          {perguntarFrequencia && userId && <PerguntaFrequencia clienteId={userId} />}
        </>
      )}
    </div>
  );
}
