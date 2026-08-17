// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, ScissorsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { gerarSlots, FORMAS_PAGAMENTO, TOLERANCIA_ATRASO_MINUTOS, slotBloqueado } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PixCheckout from "@/components/PixCheckout";
import AgendamentoStepper from "@/components/AgendamentoStepper";
import { cn } from "@/lib/utils";

const PASSOS: { id: Passo; label: string }[] = [
  { id: "servico", label: "Serviço" },
  { id: "horario", label: "Horário" },
  { id: "pagamento", label: "Pagamento" },
];

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };

type Passo = "servico" | "horario" | "pagamento" | "confirmado";

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
  const [exigePagamentoAntecipado, setExigePagamentoAntecipado] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [pagarAntecipado, setPagarAntecipado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [entrandoFila, setEntrandoFila] = useState<string | null>(null);
  const [filaMensagem, setFilaMensagem] = useState<string | null>(null);
  const [agendamentoParaPagar, setAgendamentoParaPagar] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLogado(Boolean(user));
      setUserId(user?.id ?? null);

      const { data: barbeiro } = await supabase
        .from("barbeiros")
        .select("profiles(nome)")
        .eq("profile_id", barbeiroId)
        .single();
      setNomeBarbeiro((barbeiro as any)?.profiles?.nome ?? "");

      // Serviços que ESSE barbeiro oferece, com preço próprio se houver
      const { data: barbeiroServicos } = await supabase
        .from("barbeiro_servicos")
        .select("servico_id, preco_personalizado, ativo, servicos(id, nome, preco, duracao_minutos, ativo)")
        .eq("barbeiro_id", barbeiroId)
        .eq("ativo", true);

      const listaServicos = (barbeiroServicos ?? [])
        .filter((bs: any) => bs.servicos?.ativo)
        .map((bs: any) => ({
          id: bs.servicos.id,
          nome: bs.servicos.nome,
          duracao_minutos: bs.servicos.duracao_minutos,
          preco: bs.preco_personalizado ?? bs.servicos.preco,
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
  const slotsLivres = slots.filter(
    (s) => !horariosOcupados.includes(s) && !slotBloqueado(s, bloqueiosDia)
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
    setEnviando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !servicoSelecionado || !horarioSelecionado) {
      setErro("Dados incompletos.");
      setEnviando(false);
      return;
    }

    const dataHoraISO = `${data}T${horarioSelecionado}:00`;
    const pagaAntecipado = exigePagamentoAntecipado || pagarAntecipado;

    // O pagamento antecipado agora é real (Mercado Pago, só Pix) e não é
    // instantâneo como o antigo mock - o agendamento sempre entra como
    // "pendente" e só é confirmado quando o Pix é aprovado.
    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: user.id,
        barbeiro_id: barbeiroId,
        servico_id: servicoSelecionado.id,
        data_hora: dataHoraISO,
        status: "pendente",
        forma_pagamento: (pagaAntecipado ? "pix" : formaPagamento) as any,
        pagamento_antecipado: false,
        valor_servico: precoFinal,
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

    setEnviando(false);

    if (pagaAntecipado) {
      setAgendamentoParaPagar(agendamento.id);
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
        <Button
          onClick={() => router.push(`/login?next=/agendar/${barbeiroId}`)}
          className="mt-6 uppercase tracking-widest"
        >
          Ir para login
        </Button>
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
                setPasso("horario");
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

      {passo === "horario" && (
        <div className="mt-8">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Data</label>
          <Input
            type="date"
            value={data}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setData(e.target.value);
              setHorarioSelecionado(null);
              setFilaMensagem(null);
            }}
            className="mt-2 h-11 bg-ink-soft"
          />

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
              Tolerância de atraso: {TOLERANCIA_ATRASO_MINUTOS} minutos
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Chegando com mais de {TOLERANCIA_ATRASO_MINUTOS} minutos de atraso, seu
              agendamento será cancelado automaticamente e sua próxima marcação
              exigirá pagamento antecipado. Cancelamentos por sua conta só podem
              ser feitos até 1 hora antes do horário marcado.
            </AlertDescription>
          </Alert>

          <Button
            disabled={!horarioSelecionado}
            onClick={() => setPasso("pagamento")}
            className="mt-6 w-full uppercase tracking-widest"
          >
            Continuar
          </Button>
        </div>
      )}

      {passo === "pagamento" && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            {servicoSelecionado?.nome} · {data} às {horarioSelecionado} · R${" "}
            {precoFinal.toFixed(2).replace(".", ",")}
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
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                    pagarAntecipado
                      ? "border-gold bg-gold-gradient text-ink"
                      : "border-border text-muted-foreground hover:border-gold"
                  }`}
                >
                  Pagar agora (Pix)
                </button>
              </div>
            </>
          )}

          {exigePagamentoAntecipado || pagarAntecipado ? (
            <Alert className="mt-6 border-gold/40 bg-gold/10">
              <AlertDescription className="text-foreground/90">
                Pagamento antecipado é feito só via <strong>Pix</strong> - depois de
                confirmar, um QR Code aparece na tela para você escanear ou copiar o código.
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

          <Alert className="mt-6 border-gold/40 bg-gold/10">
            <ClockIcon className="text-gold" />
            <AlertTitle className="uppercase tracking-wider text-gold">
              Lembrete: tolerância de atraso de {TOLERANCIA_ATRASO_MINUTOS} minutos
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              O barbeiro verá sua forma de pagamento escolhida na comanda do
              atendimento.
            </AlertDescription>
          </Alert>

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
        criarEndpoint="/api/pagamentos/mercadopago/criar-pix"
        corpo={{ agendamentoId: agendamentoParaPagar }}
        valor={precoFinal}
        onConfirmado={() => {
          setPasso("confirmado");
          setAgendamentoParaPagar(null);
        }}
      />

      {passo === "confirmado" && (
        <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
          <ScissorsIcon className="mx-auto size-8 text-gold" />
          <p className="mt-3 font-display text-3xl text-foreground">Tudo certo!</p>
          <p className="mt-3 text-muted-foreground">
            Seu horário com {nomeBarbeiro} em {data} às {horarioSelecionado} foi
            registrado. Você vai receber um lembrete por WhatsApp 1 hora antes.
            Acompanhe sua comanda em tempo real no painel.
          </p>
          <Alert variant="destructive" className="mt-4 text-left">
            <AlertDescription>
              Lembrete: tolerância de atraso de {TOLERANCIA_ATRASO_MINUTOS} minutos.
              Após esse tempo o horário será cancelado.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push("/painel/cliente")}
            className="mt-6 uppercase tracking-widest"
          >
            Ver meus agendamentos
          </Button>
        </div>
      )}
    </div>
  );
}
