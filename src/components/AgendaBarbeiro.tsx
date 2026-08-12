"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "No-show",
  concluido: "Concluído",
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
        <p className="text-sm text-neutral-500">Nenhum agendamento por enquanto.</p>
      )}
      {agendamentos.map((a) => (
        <div key={a.id} className="rounded-xl border border-ink-line bg-ink-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-neutral-100">
                {a.clientes?.profiles?.nome} · {a.servicos?.nome}
              </p>
              <p className="text-sm text-neutral-400">
                {new Date(a.data_hora).toLocaleString("pt-BR")} ·{" "}
                {a.clientes?.profiles?.telefone ?? "sem telefone"}
              </p>
              <p className="text-xs uppercase tracking-widest text-gold">
                {STATUS_LABEL[a.status]}
              </p>
            </div>
            {(a.status === "pendente" || a.status === "confirmado") && (
              <div className="flex gap-2">
                {a.status === "pendente" && (
                  <button
                    disabled={loadingId === a.id}
                    onClick={() => atualizarStatus(a.id, "confirmado")}
                    className="rounded-full border border-green-500/40 px-3 py-1.5 text-xs font-bold text-green-400 hover:bg-green-500/10"
                  >
                    Confirmar
                  </button>
                )}
                <button
                  disabled={loadingId === a.id}
                  onClick={() => atualizarStatus(a.id, "concluido")}
                  className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/10"
                >
                  Concluir
                </button>
                <button
                  disabled={loadingId === a.id}
                  onClick={() => marcarNoShow(a.id)}
                  className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10"
                >
                  Marcar atraso (no-show)
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
