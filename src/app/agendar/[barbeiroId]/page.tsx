// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gerarSlots, FORMAS_PAGAMENTO, TOLERANCIA_ATRASO_MINUTOS } from "@/lib/constants";
import { processarPagamentoMock } from "@/lib/payments";

type Servico = { id: string; nome: string; preco: number; duracao_minutos: number };

type Passo = "servico" | "horario" | "pagamento" | "confirmado";

export default function AgendarPage() {
  const { barbeiroId } = useParams<{ barbeiroId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [passo, setPasso] = useState<Passo>("servico");
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [nomeBarbeiro, setNomeBarbeiro] = useState("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [data, setData] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [diaAtende, setDiaAtende] = useState(true);
  const [horaInicioDia, setHoraInicioDia] = useState("09:00");
  const [horaFimDia, setHoraFimDia] = useState("19:30");
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [exigePagamentoAntecipado, setExigePagamentoAntecipado] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [pagarAntecipado, setPagarAntecipado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLogado(Boolean(user));

      const { data: barbeiro } = await supabase
        .from("barbeiros")
        .select("profiles(nome)")
        .eq("profile_id", barbeiroId)
        .single();
      setNomeBarbeiro((barbeiro as any)?.profiles?.nome ?? "");

      const { data: servicosData } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("preco");
      setServicos(servicosData ?? []);

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
      const diaSemana = new Date(`${data}T00:00:00`).getDay();
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
        // Barbeiro ainda sem configuração própria: usa janela padrão da casa
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
  const slotsDisponiveis = slots.filter((s) => !horariosOcupados.includes(s));

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

    let statusPagamento: "aprovado" | null = null;
    let referenciaPagamento: string | null = null;

    if (pagaAntecipado) {
      const resultado = await processarPagamentoMock(
        formaPagamento as any,
        Number(servicoSelecionado.preco)
      );
      if (!resultado.aprovado) {
        setErro("Pagamento não aprovado. Tente novamente.");
        setEnviando(false);
        return;
      }
      statusPagamento = "aprovado";
      referenciaPagamento = resultado.referencia;
    }

    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: user.id,
        barbeiro_id: barbeiroId,
        servico_id: servicoSelecionado.id,
        data_hora: dataHoraISO,
        status: pagaAntecipado ? "confirmado" : "pendente",
        forma_pagamento: formaPagamento as any,
        pagamento_antecipado: pagaAntecipado,
        valor_servico: servicoSelecionado.preco,
      })
      .select()
      .single();

    if (agendamentoError || !agendamento) {
      setErro(agendamentoError?.message ?? "Não foi possível criar o agendamento. Talvez esse horário já tenha sido reservado.");
      setEnviando(false);
      return;
    }

    if (pagaAntecipado) {
      await supabase.from("pagamentos").insert({
        agendamento_id: agendamento.id,
        metodo: formaPagamento as any,
        status: statusPagamento!,
        valor: servicoSelecionado.preco,
        gateway_referencia: referenciaPagamento,
      });
    }

    setEnviando(false);
    setPasso("confirmado");
  }

  if (carregando) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-neutral-500">Carregando...</div>;
  }

  if (!logado) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-neutral-50">Faça login para agendar</h1>
        <p className="mt-4 text-neutral-400">Você precisa de uma conta de cliente para marcar um horário.</p>
        <button
          onClick={() => router.push(`/login?next=/agendar/${barbeiroId}`)}
          className="mt-6 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
        >
          Ir para login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Agendamento com {nomeBarbeiro}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-neutral-50">
        {passo === "servico" && "Escolha o serviço"}
        {passo === "horario" && "Escolha data e horário"}
        {passo === "pagamento" && "Forma de pagamento"}
        {passo === "confirmado" && "Agendamento confirmado!"}
      </h1>

      {passo === "servico" && (
        <div className="mt-8 grid gap-3">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoSelecionado(s);
                setPasso("horario");
              }}
              className="flex items-center justify-between rounded-xl border border-ink-line bg-ink-soft px-5 py-4 text-left hover:border-gold"
            >
              <div>
                <p className="font-semibold text-neutral-100">{s.nome}</p>
                <p className="text-xs text-neutral-500">{s.duracao_minutos} min</p>
              </div>
              <p className="font-display text-2xl text-gold-gradient">
                R$ {Number(s.preco).toFixed(2).replace(".", ",")}
              </p>
            </button>
          ))}
        </div>
      )}

      {passo === "horario" && (
        <div className="mt-8">
          <label className="text-xs uppercase tracking-widest text-neutral-500">Data</label>
          <input
            type="date"
            value={data}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setData(e.target.value);
              setHorarioSelecionado(null);
            }}
            className="mt-2 w-full rounded-lg border border-ink-line bg-ink-soft px-4 py-3 text-neutral-100 focus:border-gold focus:outline-none"
          />

          <p className="mt-6 text-xs uppercase tracking-widest text-neutral-500">
            {diaAtende
              ? `Horários disponíveis (${horaInicioDia} - ${horaFimDia}, a cada 30 min)`
              : "Horários disponíveis"}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slotsDisponiveis.map((s) => (
              <button
                key={s}
                onClick={() => setHorarioSelecionado(s)}
                className={`rounded-lg border px-2 py-2 text-sm ${
                  horarioSelecionado === s
                    ? "border-gold bg-gold-gradient font-bold text-ink"
                    : "border-ink-line text-neutral-300 hover:border-gold"
                }`}
              >
                {s}
              </button>
            ))}
            {!diaAtende && (
              <p className="col-span-full text-sm text-neutral-500">
                {nomeBarbeiro} não atende nessa data (folga ou dia fechado). Escolha
                outra data.
              </p>
            )}
            {diaAtende && slotsDisponiveis.length === 0 && (
              <p className="col-span-full text-sm text-neutral-500">
                Nenhum horário disponível nesta data — todos já foram reservados.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm font-bold uppercase tracking-wider text-gold">
              ⏱ Tolerância de atraso: {TOLERANCIA_ATRASO_MINUTOS} minutos
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              Chegando com mais de {TOLERANCIA_ATRASO_MINUTOS} minutos de atraso, seu
              agendamento será cancelado automaticamente e sua próxima marcação
              exigirá pagamento antecipado.
            </p>
          </div>

          <button
            disabled={!horarioSelecionado}
            onClick={() => setPasso("pagamento")}
            className="mt-6 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {passo === "pagamento" && (
        <div className="mt-8">
          <p className="text-sm text-neutral-400">
            {servicoSelecionado?.nome} · {data} às {horarioSelecionado} · R${" "}
            {Number(servicoSelecionado?.preco).toFixed(2).replace(".", ",")}
          </p>

          <p className="mt-6 text-xs uppercase tracking-widest text-neutral-500">
            Forma de pagamento
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {FORMAS_PAGAMENTO.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormaPagamento(f.id)}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  formaPagamento === f.id
                    ? "border-gold bg-gold-gradient font-bold text-ink"
                    : "border-ink-line text-neutral-300 hover:border-gold"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {exigePagamentoAntecipado ? (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              Devido a um cancelamento por atraso anterior, esta marcação exige
              pagamento antecipado obrigatório.
            </div>
          ) : (
            <label className="mt-6 flex items-center gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={pagarAntecipado}
                onChange={(e) => setPagarAntecipado(e.target.checked)}
                className="h-4 w-4 accent-[#C9A227]"
              />
              Pagar antecipado agora (gateway simulado, aprovação instantânea)
            </label>
          )}

          <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm font-bold uppercase tracking-wider text-gold">
              ⏱ Lembrete: tolerância de atraso de {TOLERANCIA_ATRASO_MINUTOS} minutos
            </p>
          </div>

          {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

          <button
            disabled={enviando}
            onClick={confirmarAgendamento}
            className="mt-6 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
          >
            {enviando ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </div>
      )}

      {passo === "confirmado" && (
        <div className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
          <p className="font-display text-3xl text-neutral-50">Tudo certo! ✂️</p>
          <p className="mt-3 text-neutral-300">
            Seu horário com {nomeBarbeiro} em {data} às {horarioSelecionado} foi
            registrado. Você vai receber um lembrete por WhatsApp 1 hora antes.
          </p>
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-semibold text-red-300">
            Lembrete: tolerância de atraso de {TOLERANCIA_ATRASO_MINUTOS} minutos.
            Após esse tempo o horário será cancelado.
          </p>
          <button
            onClick={() => router.push("/painel/cliente")}
            className="mt-6 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            Ver meus agendamentos
          </button>
        </div>
      )}
    </div>
  );
}
