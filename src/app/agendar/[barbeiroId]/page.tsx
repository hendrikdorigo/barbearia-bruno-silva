"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeftIcon, ClockIcon, ScissorsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ANTECEDENCIA_MINIMA_MINUTOS, gerarSlots, slotBloqueado, type FormaPagamento } from "@/lib/constants";
import { paraDataSP, paraHoraSP } from "@/lib/timezone-sp";
import { aplicarAjusteFormaPagamento, type AjusteFormaPagamento } from "@/lib/ajustes-pagamento";
import SeletorFormaPagamento from "@/components/agendar/SeletorFormaPagamento";
import AvisoAtraso from "@/components/agendar/AvisoAtraso";
import { valorPorVisita, type PacoteCliente } from "@/lib/pacotes-cliente";
import { usePacoteUsavel } from "@/lib/use-pacote-usavel";
import SeletorPacote from "@/components/agendar/SeletorPacote";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AgendamentoStepper from "@/components/AgendamentoStepper";
import SeletorDataFaixa from "@/components/SeletorDataFaixa";
import ProdutoPicker from "@/components/ProdutoPicker";
import PerguntaFrequencia from "@/components/PerguntaFrequencia";
import { type Produto, type Carrinho, itensCarrinho, totalCarrinho, salvarProdutosNaComanda } from "@/lib/produtos-carrinho";
import { cn } from "@/lib/utils";

const PASSOS: { id: Passo; label: string }[] = [
  { id: "servico", label: "Serviço" },
  { id: "horario", label: "Horário" },
  { id: "produtos", label: "Produtos" },
  { id: "pagamento", label: "Pagamento" },
];

type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  imagem_url?: string | null;
};

type Passo = "servico" | "horario" | "produtos" | "pagamento" | "confirmado";

const ORDEM_PASSOS: Passo[] = ["servico", "horario", "produtos", "pagamento"];

export default function AgendarPage() {
  const { barbeiroId } = useParams<{ barbeiroId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicoPreSelecionadoId = searchParams.get("servico");
  const supabase = createClient();

  const [passo, setPasso] = useState<Passo>("servico");
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [nomeBarbeiro, setNomeBarbeiro] = useState("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [precoAjustado, setPrecoAjustado] = useState<number | null>(null);
  const [ajustesAtivos, setAjustesAtivos] = useState<any[]>([]);
  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [bloqueiosDia, setBloqueiosDia] = useState<{ hora_inicio: string; hora_fim: string }[]>([]);
  const [diaAtende, setDiaAtende] = useState(true);
  const [horaInicioDia, setHoraInicioDia] = useState("09:00");
  const [horaFimDia, setHoraFimDia] = useState("19:30");
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [ajustesFormaPagamento, setAjustesFormaPagamento] = useState<AjusteFormaPagamento[]>([]);
  const [pacotes, setPacotes] = useState<PacoteCliente[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("dinheiro");
  const [erro, setErro] = useState<string | null>(null);
  const [avisoProdutos, setAvisoProdutos] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [entrandoFila, setEntrandoFila] = useState<string | null>(null);
  const [filaMensagem, setFilaMensagem] = useState<string | null>(null);
  const [perguntarFrequencia, setPerguntarFrequencia] = useState(false);

  function voltarPasso() {
    const i = ORDEM_PASSOS.indexOf(passo as any);
    if (i > 0) setPasso(ORDEM_PASSOS[i - 1]);
  }

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
      if (user) {
        const { data: clienteData } = await supabase
          .from("clientes")
          .select("bloqueado")
          .eq("profile_id", user.id)
          .maybeSingle();
        setBloqueado(Boolean((clienteData as any)?.bloqueado));

        const { data: pacotesData } = await supabase
          .from("pacotes_cliente")
          .select("*")
          .eq("cliente_id", user.id)
          .eq("ativo", true);
        setPacotes((pacotesData ?? []) as any);
      }

      const { data: barbeiro } = await supabase
        .from("barbeiros")
        .select("profiles(nome)")
        .eq("profile_id", barbeiroId)
        .single();
      setNomeBarbeiro((barbeiro as any)?.profiles?.nome ?? "");

      const { data: produtosData } = await supabase
        .from("produtos")
        .select("id, nome, preco, categoria, imagem_url")
        .eq("ativo", true)
        .order("categoria");
      setProdutos(produtosData ?? []);

      const { data: ajustesFpData } = await supabase.from("ajustes_forma_pagamento").select("*");
      setAjustesFormaPagamento((ajustesFpData ?? []) as any);

      // Serviços que ESSE barbeiro oferece, com preço próprio se houver
      const { data: barbeiroServicos } = await supabase
        .from("barbeiro_servicos")
        .select(
          "servico_id, preco_personalizado, ativo, servicos(id, nome, preco, duracao_minutos, imagem_url, ativo)"
        )
        .eq("barbeiro_id", barbeiroId)
        .eq("ativo", true);

      const listaServicos = (barbeiroServicos ?? [])
        .filter((bs: any) => bs.servicos?.ativo)
        .map((bs: any) => ({
          id: bs.servicos.id,
          nome: bs.servicos.nome,
          duracao_minutos: bs.servicos.duracao_minutos,
          preco: bs.preco_personalizado ?? bs.servicos.preco,
          imagem_url: bs.servicos.imagem_url,
        }))
        .sort((a: any, b: any) => a.preco - b.preco);

      let servicosFinal = listaServicos;
      if (listaServicos.length > 0) {
        setServicos(listaServicos);
      } else {
        // fallback: barbeiro ainda sem personalização cadastrada, usa tabela padrão
        const { data: servicosData } = await supabase
          .from("servicos")
          .select("*")
          .eq("ativo", true)
          .order("preco");
        servicosFinal = servicosData ?? [];
        setServicos(servicosFinal);
      }

      if (servicoPreSelecionadoId) {
        const preSelecionado = servicosFinal.find((s: any) => s.id === servicoPreSelecionadoId);
        if (preSelecionado) {
          setServicoSelecionado(preSelecionado);
          setPasso("horario");
        }
      }

      setCarregando(false);
    }
    carregar();
  }, [barbeiroId, supabase]);

  useEffect(() => {
    async function carregarHorarios() {
      const inicio = `${data}T00:00:00`;
      const fim = `${data}T23:59:59`;
      const { data: agendamentos } = await supabase
        .from("agendamentos")
        .select("data_hora")
        .eq("barbeiro_id", barbeiroId)
        .gte("data_hora", inicio)
        .lte("data_hora", fim)
        .in("status", ["pendente", "confirmado"]);

      const ocupados = (agendamentos ?? []).map((a) =>
        new Date(a.data_hora).toTimeString().slice(0, 5)
      );
      setHorariosOcupados(ocupados);

      const diaSemana = new Date(`${data}T00:00:00`).getDay();

      // bloqueios (almoço/compromissos) — recorrentes daquele dia da semana OU específicos daquela data
      const { data: bloqueios } = await supabase
        .from("barbeiro_bloqueios")
        .select("hora_inicio, hora_fim, dia_semana, data")
        .eq("barbeiro_id", barbeiroId)
        .or(`dia_semana.eq.${diaSemana},data.eq.${data}`);
      setBloqueiosDia(bloqueios ?? []);

      // ajustes de preço (acréscimo/desconto) aplicáveis nessa data
      const { data: ajustes } = await supabase
        .from("servico_ajustes")
        .select("*")
        .eq("barbeiro_id", barbeiroId)
        .eq("ativo", true);
      const aplicaveis = (ajustes ?? []).filter((a: any) => {
        const porData =
          (!a.data_inicio || a.data_inicio <= data) && (!a.data_fim || a.data_fim >= data);
        const porDiaSemana = a.dia_semana === null || a.dia_semana === diaSemana;
        return porData && porDiaSemana;
      });
      setAjustesAtivos(aplicaveis);

      // 1) Exceção específica para essa data (folga ou horário diferente) tem prioridade
      const { data: excecao } = await supabase
        .from("barbeiro_excecoes")
        .select("*")
        .eq("barbeiro_id", barbeiroId)
        .eq("data", data)
        .maybeSingle();

      if (excecao) {
        setDiaAtende(Boolean((excecao as any).ativo));
        if ((excecao as any).ativo) {
          setHoraInicioDia((excecao as any).hora_inicio?.slice(0, 5) ?? "09:00");
          setHoraFimDia((excecao as any).hora_fim?.slice(0, 5) ?? "19:30");
        }
        return;
      }

      // 2) Sem exceção: usa a regra padrão daquele dia da semana
      const { data: horarioDia } = await supabase
        .from("barbeiro_horarios")
        .select("*")
        .eq("barbeiro_id", barbeiroId)
        .eq("dia_semana", diaSemana)
        .maybeSingle();

      if (horarioDia) {
        setDiaAtende(Boolean((horarioDia as any).ativo));
        setHoraInicioDia((horarioDia as any).hora_inicio?.slice(0, 5) ?? "09:00");
        setHoraFimDia((horarioDia as any).hora_fim?.slice(0, 5) ?? "19:30");
      } else {
        setDiaAtende(diaSemana !== 0);
        setHoraInicioDia("09:00");
        setHoraFimDia("19:30");
      }
    }
    if (data) carregarHorarios();
  }, [data, barbeiroId, supabase]);

  const slots = useMemo(
    () => (diaAtende ? gerarSlots(horaInicioDia, horaFimDia) : []),
    [diaAtende, horaInicioDia, horaFimDia]
  );
  // Sem tolerância de atraso: se o dia escolhido é hoje, não deixa marcar
  // horário muito em cima da hora (dentro da antecedência mínima).
  const limite = new Date(Date.now() + ANTECEDENCIA_MINIMA_MINUTOS * 60 * 1000).toISOString();
  const ehHoje = data === paraDataSP(limite);
  const horaLimite = paraHoraSP(limite);
  const slotsLivres = slots.filter(
    (s) => (!ehHoje || s > horaLimite) && !horariosOcupados.includes(s) && !slotBloqueado(s, bloqueiosDia)
  );
  const slotsBloqueadosPorAgenda = slots.filter((s) => slotBloqueado(s, bloqueiosDia));

  const precoFinal = useMemo(() => {
    if (!servicoSelecionado) return 0;
    let preco = Number(servicoSelecionado.preco);
    for (const a of ajustesAtivos) {
      if (a.servico_id && a.servico_id !== servicoSelecionado.id) continue;
      const delta = a.valor_tipo === "percentual" ? (preco * Number(a.valor)) / 100 : Number(a.valor);
      preco += a.tipo === "desconto" ? -delta : delta;
    }
    return Math.max(0, Math.round(preco * 100) / 100);
  }, [servicoSelecionado, ajustesAtivos]);

  const { pacoteUsavel, usarPacote, setUsarPacote } = usePacoteUsavel(pacotes, data);

  const precoFinalComPagamento =
    usarPacote && pacoteUsavel
      ? valorPorVisita(pacoteUsavel)
      : aplicarAjusteFormaPagamento(precoFinal, formaPagamento, ajustesFormaPagamento);
  const totalProdutos = totalCarrinho(carrinho, produtos);
  const valorTotal = precoFinalComPagamento + totalProdutos;

  async function entrarNaFila(horaEspecifica: string | null) {
    if (!userId || !servicoSelecionado) return;
    setEntrandoFila(horaEspecifica ?? "dia");
    setFilaMensagem(null);
    const { error } = await supabase.from("fila_espera").insert({
      cliente_id: userId,
      barbeiro_id: barbeiroId,
      servico_id: servicoSelecionado.id,
      data,
      hora: horaEspecifica,
    });
    setEntrandoFila(null);
    setFilaMensagem(
      error
        ? "Não foi possível entrar na fila (talvez você já esteja aguardando este dia)."
        : "Você entrou na fila de espera! Se alguém desistir, avisamos você por notificação."
    );
  }

  async function confirmarAgendamento() {
    setErro(null);
    setAvisoProdutos(null);
    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !servicoSelecionado || !horarioSelecionado) {
      setErro("Dados incompletos.");
      setEnviando(false);
      return;
    }

    // -03:00 explícito: Brasília não tem horário de verão desde 2019, então
    // é sempre UTC-3. Sem isso, o Postgres guarda a string como se já fosse
    // UTC e o horário salvo fica 3h adiantado em relação ao escolhido.
    const dataHoraISO = `${data}T${horarioSelecionado}:00-03:00`;

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: user.id,
        barbeiro_id: barbeiroId,
        servico_id: servicoSelecionado.id,
        data_hora: dataHoraISO,
        status: "confirmado",
        forma_pagamento: usarPacote && pacoteUsavel ? null : (formaPagamento as any),
        pagamento_antecipado: Boolean(usarPacote && pacoteUsavel),
        valor_servico: precoFinalComPagamento,
        pacote_cliente_id: usarPacote && pacoteUsavel ? pacoteUsavel.id : null,
      })
      .select()
      .single();

    if (agendamentoError || !agendamento) {
      setErro(agendamentoError?.message ?? "Não foi possível criar o agendamento. Talvez esse horário já tenha sido reservado.");
      setEnviando(false);
      return;
    }

    // Coloca o evento no Google Calendar do barbeiro assim que o horario e
    // reservado, sem esperar ele confirmar. Nao bloqueia a tela de sucesso.
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
        <Button
          onClick={() => router.push(`/login?next=/agendar/${barbeiroId}`)}
          className="mt-6 uppercase tracking-widest"
        >
          Ir para login
        </Button>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-foreground">Agendamento indisponível</h1>
        <p className="mt-4 text-muted-foreground">
          Sua conta está temporariamente bloqueada para novos agendamentos. Fale diretamente com a
          barbearia para mais informações.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Agendamento com {nomeBarbeiro}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">
        {passo === "servico" && "Escolha o serviço"}
        {passo === "horario" && "Escolha data e horário"}
        {passo === "produtos" && "Quer levar algo da loja?"}
        {passo === "pagamento" && "Forma de pagamento"}
        {passo === "confirmado" && "Agendamento confirmado!"}
      </h1>

      <AgendamentoStepper passos={PASSOS} atual={passo} />

      {passo !== "servico" && passo !== "confirmado" && (
        <button
          onClick={voltarPasso}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeftIcon className="size-3.5" />
          Voltar
        </button>
      )}

      {passo === "servico" && (
        <div className="mt-8 grid gap-3">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoSelecionado(s);
                setPasso("horario");
              }}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-ink-soft px-5 py-4 text-left transition-colors hover:border-gold"
            >
              <div className="flex items-center gap-4">
                <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                  {s.imagem_url ? (
                    <Image src={s.imagem_url} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ScissorsIcon className="size-6 text-muted-foreground" />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{s.nome}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    {s.duracao_minutos} min
                  </p>
                </div>
              </div>
              <p className="font-mono text-2xl font-medium text-gold-gradient">
                R$ {Number(s.preco).toFixed(2).replace(".", ",")}
              </p>
            </button>
          ))}
        </div>
      )}

      {passo === "horario" && (
        <div className="mt-8">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Data</label>
          <div className="mt-3">
            <SeletorDataFaixa
              value={data}
              onChange={(novaData) => {
                setData(novaData);
                setHorarioSelecionado(null);
                setFilaMensagem(null);
              }}
            />
          </div>

          {precoFinal !== Number(servicoSelecionado?.preco) && (
            <p className="mt-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
              Preço nesta data: <strong>R$ {precoFinal.toFixed(2).replace(".", ",")}</strong>{" "}
              <span className="text-muted-foreground line-through">
                R$ {Number(servicoSelecionado?.preco).toFixed(2).replace(".", ",")}
              </span>
            </p>
          )}

          <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
            {diaAtende
              ? `Horários disponíveis (${horaInicioDia} - ${horaFimDia}, a cada 30 min)`
              : "Horários disponíveis"}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slotsLivres.map((s) => (
              <button
                key={s}
                onClick={() => setHorarioSelecionado(s)}
                className={`rounded-lg border px-2 py-2 text-sm ${
                  horarioSelecionado === s
                    ? "border-gold bg-gold-gradient font-bold text-ink"
                    : "border-border text-muted-foreground hover:border-gold"
                }`}
              >
                {s}
              </button>
            ))}
            {!diaAtende && (
              <p className="col-span-full text-sm text-muted-foreground">
                {nomeBarbeiro} não atende nessa data (folga ou dia fechado). Escolha
                outra data.
              </p>
            )}
          </div>

          {diaAtende && horariosOcupados.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/70">
                Já ocupados (entre na fila de espera se quiser)
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots
                  .filter((s) => horariosOcupados.includes(s))
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => entrarNaFila(s)}
                      disabled={entrandoFila === s}
                      title="Entrar na fila de espera para este horário"
                      className="rounded-lg border border-border/50 px-2 py-2 text-xs text-muted-foreground/70 line-through hover:border-gold hover:text-gold hover:no-underline disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {diaAtende && slotsLivres.length === 0 && (
            <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
              <p className="text-sm text-foreground/90">
                Não há mais horários livres neste dia. Entre na fila de espera —
                se alguém desistir, você é avisado na hora.
              </p>
              <button
                onClick={() => entrarNaFila(null)}
                disabled={entrandoFila === "dia"}
                className="mt-3 rounded-full border border-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                {entrandoFila === "dia" ? "Entrando..." : "Entrar na fila deste dia"}
              </button>
            </div>
          )}

          {filaMensagem && <p className="mt-4 text-sm text-gold">{filaMensagem}</p>}

          <Alert className="mt-6 border-gold/40 bg-gold/10">
            <ClockIcon className="text-gold" />
            <AlertTitle className="uppercase tracking-wider text-gold">
              Sem tolerância de atraso
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Chegue no horário marcado — passou da hora, o agendamento pode ser
              cancelado. Cancelamentos por sua conta só podem ser feitos até 1
              hora antes do horário marcado.
            </AlertDescription>
          </Alert>

          <Button
            disabled={!horarioSelecionado}
            onClick={() => setPasso("produtos")}
            className="mt-6 w-full uppercase tracking-widest"
          >
            Continuar
          </Button>
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
            {servicoSelecionado?.nome} · {data} às {horarioSelecionado}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-gold-gradient">
            R$ {valorTotal.toFixed(2).replace(".", ",")}
            {totalProdutos > 0 && (
              <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                (serviço R$ {precoFinalComPagamento.toFixed(2).replace(".", ",")} + produtos R${" "}
                {totalProdutos.toFixed(2).replace(".", ",")})
              </span>
            )}
          </p>

          {pacoteUsavel && (
            <SeletorPacote pacote={pacoteUsavel} usar={usarPacote} onChange={setUsarPacote} />
          )}

          {!(usarPacote && pacoteUsavel) && (
            <>
              <SeletorFormaPagamento
                valor={formaPagamento}
                onChange={setFormaPagamento}
                ajustes={ajustesFormaPagamento}
              />
            </>
          )}

          <Alert className="mt-6 border-gold/40 bg-gold/10">
            <ClockIcon className="text-gold" />
            <AlertTitle className="uppercase tracking-wider text-gold">
              Pagamento no atendimento
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              O barbeiro verá sua forma de pagamento escolhida na comanda do
              atendimento.
            </AlertDescription>
          </Alert>

          <AvisoAtraso className="mt-6" />

          {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}

          <Button
            disabled={enviando}
            onClick={confirmarAgendamento}
            className="mt-6 w-full uppercase tracking-widest"
          >
            {enviando ? "Confirmando..." : "Confirmar agendamento"}
          </Button>
        </div>
      )}

      {passo === "confirmado" && (
        <>
          <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
            <ScissorsIcon className="mx-auto size-8 text-gold" />
            <p className="mt-3 font-display text-3xl text-foreground">Tudo certo!</p>
            <p className="mt-3 text-muted-foreground">
              Seu horário com {nomeBarbeiro} em {data} às {horarioSelecionado} foi
              registrado. Você vai receber um lembrete por WhatsApp 1 hora antes.
              Acompanhe sua comanda em tempo real no painel.
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
                Lembrete: não há tolerância de atraso — chegue no horário marcado. Faltar cancela o
                agendamento e soma o valor na sua próxima visita.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/painel/cliente")}
              className="mt-6 uppercase tracking-widest"
            >
              Ver meus agendamentos
            </Button>
          </div>

          {perguntarFrequencia && userId && <PerguntaFrequencia clienteId={userId} />}
        </>
      )}
    </div>
  );
}
