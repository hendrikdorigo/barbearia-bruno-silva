"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "No-show",
  concluido: "Concluído",
};

const PAGAMENTO_LABEL: Record<string, string> = {
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
};

export default function AgendaBarbeiro({ agendamentos }: { agendamentos: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function atualizarStatus(id: string, status: string) {
    setLoadingId(id);
    await supabase.from("agendamentos").update({ status }).eq("id", id);
    setLoadingId(null);
    router.refresh();
  }

  async function marcarNoShow(id: string) {
    setLoadingId(id);
    await supabase.rpc("marcar_no_show", { p_agendamento_id: id });
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3">
      {agendamentos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum agendamento por enquanto.</p>
      )}
      {agendamentos.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-ink-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">
                {a.clientes?.profiles?.nome} · {a.servicos?.nome}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(a.data_hora).toLocaleString("pt-BR")} ·{" "}
                {a.clientes?.profiles?.telefone ?? "sem telefone"}
              </p>
              <p className="text-xs uppercase tracking-widest text-gold">
                {STATUS_LABEL[a.status]}
              </p>
              {a.forma_pagamento && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Pagamento: {PAGAMENTO_LABEL[a.forma_pagamento] ?? a.forma_pagamento}{" "}
                  {a.pagamento_antecipado ? "(antecipado, já pago)" : "(vai pagar no local)"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/painel/barbeiro/comanda/${a.id}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-gold hover:text-gold"
              >
                Ver comanda
              </Link>
              {(a.status === "pendente" || a.status === "confirmado") && (
                <>
                  {a.status === "pendente" && (
                    <button
                      disabled={loadingId === a.id}
                      onClick={() => atualizarStatus(a.id, "confirmado")}
                      className="rounded-full border border-green-500/40 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/10"
                    >
                      Confirmar
                    </button>
                  )}
                  <button
                    disabled={loadingId === a.id}
                    onClick={() => atualizarStatus(a.id, "concluido")}
                    className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/10"
                  >
                    Concluir atendimento
                  </button>
                  <button
                    disabled={loadingId === a.id}
                    onClick={() => marcarNoShow(a.id)}
                    className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    Cliente não veio (no-show)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
