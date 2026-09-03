"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { paraDataSP, somaDias } from "@/lib/timezone-sp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIAS_ABREV = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Tira horizontal de dias pra escolher a data de agendamento — troca o
// <input type="date"> nativo por algo tocável/arrastável, no mesmo padrão
// visual da tira de dias já usada na agenda do barbeiro (AgendaCalendario).
export default function SeletorDataFaixa({
  value,
  onChange,
  dias = 60,
}: {
  value: string;
  onChange: (ymd: string) => void;
  dias?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoje = useMemo(() => paraDataSP(new Date().toISOString()), []);

  const opcoes = useMemo(
    () =>
      Array.from({ length: dias }, (_, i) => {
        const ymd = somaDias(hoje, i);
        const diaSemana = new Date(`${ymd}T00:00:00`).getDay();
        return { ymd, diaSemana, diaMes: Number(ymd.slice(8, 10)), mes: Number(ymd.slice(5, 7)) - 1 };
      }),
    [hoje, dias]
  );

  useEffect(() => {
    scrollRef.current
      ?.querySelector<HTMLButtonElement>(`[data-ymd="${value}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  function rolar(direcao: -1 | 1) {
    scrollRef.current?.scrollBy({ left: direcao * 220, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="hidden shrink-0 rounded-full sm:flex"
        onClick={() => rolar(-1)}
        aria-label="Dias anteriores"
      >
        <ChevronLeftIcon />
      </Button>
      <div ref={scrollRef} className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        {opcoes.map((o) => {
          const selecionado = o.ymd === value;
          const ehHoje = o.ymd === hoje;
          return (
            <button
              key={o.ymd}
              type="button"
              data-ymd={o.ymd}
              onClick={() => onChange(o.ymd)}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-colors",
                selecionado
                  ? "border-gold bg-gold-gradient text-ink"
                  : "border-border bg-ink-soft text-muted-foreground hover:border-gold hover:text-foreground",
                !selecionado && ehHoje && "border-gold/50 text-gold"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {ehHoje ? "Hoje" : DIAS_ABREV[o.diaSemana]}
              </span>
              <span className="font-display text-xl leading-none">{o.diaMes}</span>
              <span className="text-[10px] uppercase opacity-70">{MESES_ABREV[o.mes]}</span>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="hidden shrink-0 rounded-full sm:flex"
        onClick={() => rolar(1)}
        aria-label="Próximos dias"
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
