"use client";

import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/constants";
import { seloAjusteFormaPagamento, type AjusteFormaPagamento } from "@/lib/ajustes-pagamento";
import { cn } from "@/lib/utils";

/**
 * Escolha da forma de pagamento no local, com o selo de desconto/acréscimo
 * que o Bruno configurar e o destaque no dinheiro.
 *
 * Vive aqui porque as duas telas de agendamento (/agendar e
 * /agendar/[barbeiroId]) mostravam esse bloco com código idêntico - e foi
 * exatamente esse tipo de duplicação que fez avisos e regras divergirem
 * entre as duas telas ao longo do tempo.
 */
export default function SeletorFormaPagamento({
  valor,
  onChange,
  ajustes,
}: {
  valor: FormaPagamento;
  onChange: (forma: FormaPagamento) => void;
  ajustes: AjusteFormaPagamento[];
}) {
  return (
    <>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
        Forma de pagamento (no local)
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {FORMAS_PAGAMENTO.map((f) => {
          const selo = seloAjusteFormaPagamento(f.id, ajustes);
          const destaque = f.id === "dinheiro";
          const selecionado = valor === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={cn(
                "relative rounded-lg border px-4 py-3 text-sm",
                selecionado
                  ? "border-gold bg-gold-gradient font-bold text-ink"
                  : destaque
                    ? "border-gold/60 text-foreground hover:border-gold"
                    : "border-border text-muted-foreground hover:border-gold"
              )}
            >
              {f.label}
              {selo && (
                <span
                  className={cn(
                    "absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    selecionado ? "bg-ink text-gold" : "bg-gold text-ink"
                  )}
                >
                  {selo}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
