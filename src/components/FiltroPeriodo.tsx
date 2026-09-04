import Link from "next/link";
import { cn } from "@/lib/utils";

/** 30 dias é o menor período seguro: precisa cobrir o mês inteiro pros
 * cards de "Este mês" continuarem certos (mês cheio tem no máximo 31 dias,
 * e 30 dias pra trás sempre alcança o dia 1º do mês corrente). */
export const PERIODOS = [
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 365, label: "1 ano" },
  { dias: 0, label: "Tudo" },
] as const;

export const PERIODO_PADRAO_DIAS = 90;

/** Lê o ?dias= da URL e devolve um valor válido (cai no padrão se vier lixo). */
export function lerPeriodoDias(valor: string | undefined): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) return PERIODO_PADRAO_DIAS;
  return PERIODOS.some((p) => p.dias === n) ? n : PERIODO_PADRAO_DIAS;
}

export default function FiltroPeriodo({ base, dias }: { base: string; dias: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">Período</span>
      <div className="flex flex-wrap gap-1.5">
        {PERIODOS.map((p) => {
          const ativo = p.dias === dias;
          return (
            <Link
              key={p.dias}
              href={`${base}?dias=${p.dias}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                ativo
                  ? "border-gold bg-gold-gradient text-ink"
                  : "border-border text-muted-foreground hover:border-gold hover:text-foreground"
              )}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
