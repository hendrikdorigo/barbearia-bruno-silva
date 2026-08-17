import { Card } from "@/components/ui/card";
import type { EstatisticasPeriodo } from "@/lib/estatisticas";

export default function EstatisticasCards({
  titulo,
  estatisticas,
}: {
  titulo?: string;
  estatisticas: EstatisticasPeriodo;
}) {
  const periodos = [
    { label: "Hoje", dados: estatisticas.hoje },
    { label: "Esta semana", dados: estatisticas.semana },
    { label: "Este mês", dados: estatisticas.mes },
  ];

  return (
    <div>
      {titulo && (
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
      )}
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {periodos.map((p) => (
          <Card key={p.label} className="gap-1 border-border bg-ink-soft p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {p.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-medium text-foreground">
              {p.dados.atendimentos}{" "}
              <span className="text-xs font-sans font-normal text-muted-foreground">
                atendimento{p.dados.atendimentos === 1 ? "" : "s"}
              </span>
            </p>
            <p className="font-mono text-lg text-gold-gradient">
              R$ {p.dados.faturamento.toFixed(2).replace(".", ",")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
