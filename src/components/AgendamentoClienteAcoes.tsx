"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AgendamentoClienteAcoes({ agendamento }: { agendamento: any }) {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const podeCancel =
    (agendamento.status === "pendente" || agendamento.status === "confirmado") &&
    new Date(agendamento.data_hora).getTime() - Date.now() > 60 * 60 * 1000;

  const podeVerComanda = ["pendente", "confirmado", "concluido"].includes(agendamento.status);

  async function cancelar() {
    setCancelando(true);
    setErro(null);
    const resp = await fetch(`/api/agendamentos/${agendamento.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelado" }),
    });
    setCancelando(false);
    if (!resp.ok) {
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
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Ver comanda
        </Link>
      )}
      {agendamento.status === "concluido" && (
        <Link
          href={`/avaliar/${agendamento.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full border-gold/40 text-gold hover:bg-gold/10"
          )}
        >
          Avaliar
        </Link>
      )}
      {podeCancel && (
        <Button
          onClick={cancelar}
          disabled={cancelando}
          variant="destructive"
          size="sm"
          className="rounded-full"
        >
          {cancelando ? "Cancelando..." : "Cancelar (até 1h antes)"}
        </Button>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
