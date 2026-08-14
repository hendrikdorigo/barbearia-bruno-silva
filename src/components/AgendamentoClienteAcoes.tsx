"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AgendamentoClienteAcoes({ agendamento }: { agendamento: any }) {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const podeCancel =
    (agendamento.status === "pendente" || agendamento.status === "confirmado") &&
    new Date(agendamento.data_hora).getTime() - Date.now() > 60 * 60 * 1000;

  const podeVerComanda = ["pendente", "confirmado", "concluido"].includes(agendamento.status);

  async function cancelar() {
    setCancelando(true);
    setErro(null);
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", agendamento.id);
    setCancelando(false);
    if (error) {
      setErro("Cancelamentos só são permitidos até 1 hora antes do horário.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {podeVerComanda && (
        <Link
          href={`/painel/cliente/comanda/${agendamento.id}`}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-gold hover:text-gold"
        >
          Ver comanda
        </Link>
      )}
      {agendamento.status === "concluido" && (
        <Link
          href={`/avaliar/${agendamento.id}`}
          className="rounded-full border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/10"
        >
          Avaliar
        </Link>
      )}
      {podeCancel && (
        <button
          onClick={cancelar}
          disabled={cancelando}
          className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {cancelando ? "Cancelando..." : "Cancelar (até 1h antes)"}
        </button>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
