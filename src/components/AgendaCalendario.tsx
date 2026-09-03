"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarOffIcon, AlertTriangleIcon, ShieldOffIcon } from "lucide-react";
import { calcularJanelaDiaLocal } from "@/lib/disponibilidade";
import { nomeClienteAgendamento, qtdNoShowAgendamento, clienteBloqueadoAgendamento } from "@/lib/cliente-agendamento";
import { paraDataSP, paraHoraSP, somaDias } from "@/lib/timezone-sp";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AgendamentoDetalhe, { STATUS_LABEL } from "@/components/AgendamentoDetalhe";
import { cn } from "@/lib/utils";

const DIAS_ABREV = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const PX_POR_MINUTO = 1.4;

const STATUS_STYLE: Record<string, string> = {
  pendente: "border-gold/50 bg-gold/10 text-gold",
  confirmado: "border-success/50 bg-success/10 text-success",
  concluido: "border-border bg-card text-muted-foreground",
  no_show: "border-destructive/40 bg-destructive/10 text-destructive",
};

function horaParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function formatarDataCurta(ymd: string): string {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} ${MESES_ABREV[mes - 1]} ${ano}`;
}

type Horario = { dia_semana: number; ativo: boolean; hora_inicio: string; hora_fim: string };
type Excecao = { data: string; ativo: boolean; hora_inicio: string | null; hora_fim: string | null };
type Bloqueio = {
  id: string;
  dia_semana: number | null;
  data: string | null;
  hora_inicio: string;
  hora_fim: string;
  motivo: string | null;
};

export default function AgendaCalendario({
  agendamentos,
  horarios,
  excecoes,
  bloqueios,
}: {
  agendamentos: any[];
  horarios: Horario[];
  excecoes: Excecao[];
  bloqueios: Bloqueio[];
}) {
  const hoje = useMemo(() => paraDataSP(new Date().toISOString()), []);
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [agendamentoAbertoId, setAgendamentoAbertoId] = useState<string | null>(null);

  const diaSemanaSelecionado = new Date(`${dataSelecionada}T00:00:00`).getDay();
  const segundaDaSemana = somaDias(dataSelecionada, diaSemanaSelecionado === 0 ? -6 : 1 - diaSemanaSelecionado);
  const diasDaSemana = Array.from({ length: 7 }, (_, i) => somaDias(segundaDaSemana, i));

  const diasComAgendamento = useMemo(() => {
    const set = new Set<string>();
    for (const a of agendamentos) {
      if (a.status === "cancelado") continue;
      set.add(paraDataSP(a.data_hora));
    }
    return set;
  }, [agendamentos]);

  const janela = calcularJanelaDiaLocal(horarios, excecoes, dataSelecionada);

  const agendamentosDoDia = useMemo(
    () =>
      agendamentos.filter((a) => a.status !== "cancelado" && paraDataSP(a.data_hora) === dataSelecionada),
    [agendamentos, dataSelecionada]
  );

  const bloqueiosDoDia = useMemo(
    () =>
      bloqueios.filter(
        (b) => b.data === dataSelecionada || (b.data === null && b.dia_semana === diaSemanaSelecionado)
      ),
    [bloqueios, dataSelecionada, diaSemanaSelecionado]
  );

  const agendamentoAberto = agendamentos.find((a) => a.id === agendamentoAbertoId) ?? null;

  // A grade cobre o horário configurado do barbeiro, mas nunca pode cortar
  // fora da tela um agendamento real desse dia (ex: reservado manualmente
  // num horário fora do expediente padrão) - por isso a janela se expande
  // pra sempre incluir o início/fim de todo agendamento do dia.
  const inicioMin = Math.min(
    horaParaMinutos(janela.horaInicio),
    ...agendamentosDoDia.map((a) => horaParaMinutos(paraHoraSP(a.data_hora)))
  );
  const fimMin = Math.max(
    horaParaMinutos(janela.horaFim),
    ...agendamentosDoDia.map((a) => horaParaMinutos(paraHoraSP(a.data_hora)) + (a.servicos?.duracao_minutos ?? 30))
  );
  const alturaTotal = Math.max(0, (fimMin - inicioMin) * PX_POR_MINUTO);

  const horasGrade: number[] = [];
  for (let h = Math.ceil(inicioMin / 60); h <= Math.floor(fimMin / 60); h++) horasGrade.push(h);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {formatarDataCurta(diasDaSemana[0])} à {formatarDataCurta(diasDaSemana[6])}
        </p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setDataSelecionada((d) => somaDias(d, -7))}
            aria-label="Semana anterior"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={() => setDataSelecionada((d) => somaDias(d, 7))}
            aria-label="Próxima semana"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {diasDaSemana.map((dia) => {
          const diaSemana = new Date(`${dia}T00:00:00`).getDay();
          const selecionado = dia === dataSelecionada;
          return (
            <button
              key={dia}
              onClick={() => setDataSelecionada(dia)}
              className={cn(
                "flex min-w-[42px] flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-semibold transition-colors",
                selecionado
                  ? "border-gold bg-gold-gradient text-ink"
                  : "border-border text-muted-foreground hover:border-gold",
                !selecionado && dia === hoje && "border-gold/50 text-gold"
              )}
            >
              <span>{DIAS_ABREV[diaSemana]}</span>
              <span className="text-sm">{Number(dia.slice(8, 10))}</span>
              <span
                className={cn(
                  "size-1 rounded-full",
                  diasComAgendamento.has(dia) ? (selecionado ? "bg-ink" : "bg-gold") : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>

      {!janela.atende && agendamentosDoDia.length === 0 ? (
        <Empty className="mt-6 border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarOffIcon />
            </EmptyMedia>
            <EmptyTitle>Fechado nesse dia</EmptyTitle>
            <EmptyDescription>Você não atende nessa data.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="relative mt-6 flex">
          <div className="relative w-12 shrink-0 text-xs text-muted-foreground">
            {horasGrade.map((h) => (
              <span
                key={h}
                className="absolute -translate-y-1/2"
                style={{ top: `${(h * 60 - inicioMin) * PX_POR_MINUTO}px` }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          <div className="relative flex-1 border-l border-border" style={{ height: `${alturaTotal}px` }}>
            {horasGrade.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border/60"
                style={{ top: `${(h * 60 - inicioMin) * PX_POR_MINUTO}px` }}
              />
            ))}

            {bloqueiosDoDia.map((b) => {
              const inicio = Math.max(horaParaMinutos(b.hora_inicio), inicioMin);
              const fim = Math.min(horaParaMinutos(b.hora_fim), fimMin);
              if (fim <= inicio) return null;
              return (
                <div
                  key={b.id}
                  className="absolute inset-x-1 overflow-hidden rounded-lg border border-border bg-muted/40 px-3 py-2"
                  style={{
                    top: `${(inicio - inicioMin) * PX_POR_MINUTO}px`,
                    height: `${(fim - inicio) * PX_POR_MINUTO}px`,
                  }}
                >
                  <p className="text-sm font-semibold text-foreground">Fechado</p>
                  <p className="text-xs text-muted-foreground">{b.motivo ?? "Horário bloqueado"}</p>
                </div>
              );
            })}

            {agendamentosDoDia.map((a) => {
              const inicioReal = horaParaMinutos(paraHoraSP(a.data_hora));
              const duracao = a.servicos?.duracao_minutos ?? 30;
              const inicio = Math.max(inicioReal, inicioMin);
              const fim = Math.min(inicioReal + duracao, fimMin);
              if (fim <= inicio) return null;
              return (
                <button
                  key={a.id}
                  onClick={() => setAgendamentoAbertoId(a.id)}
                  className={cn(
                    "absolute inset-x-1 overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors",
                    STATUS_STYLE[a.status] ?? STATUS_STYLE.pendente
                  )}
                  style={{
                    top: `${(inicio - inicioMin) * PX_POR_MINUTO}px`,
                    height: `${Math.max(fim - inicio, 20) * PX_POR_MINUTO}px`,
                  }}
                >
                  <p className="flex items-center gap-1 truncate text-sm font-semibold">
                    {clienteBloqueadoAgendamento(a) && (
                      <ShieldOffIcon className="size-3.5 shrink-0 text-destructive" />
                    )}
                    {qtdNoShowAgendamento(a) > 0 && (
                      <AlertTriangleIcon className="size-3.5 shrink-0 text-destructive" />
                    )}
                    {paraHoraSP(a.data_hora)} · {nomeClienteAgendamento(a)}
                  </p>
                  <p className="truncate text-xs opacity-80">
                    {a.servicos?.nome} · {STATUS_LABEL[a.status]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Sheet open={!!agendamentoAbertoId} onOpenChange={(open) => !open && setAgendamentoAbertoId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do agendamento</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            {agendamentoAberto && <AgendamentoDetalhe agendamento={agendamentoAberto} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
