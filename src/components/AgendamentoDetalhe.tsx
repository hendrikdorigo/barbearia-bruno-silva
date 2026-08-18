"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  no_show: "No-show",
  concluido: "Concluído",
};

export const PAGAMENTO_LABEL: Record<string, string> = {
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
  pix: "Pix",
};

export default function AgendamentoDetalhe({ agendamento: a }: { agendamento: any }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function atualizarStatus(status: string) {
    setLoadingId(a.id);
    await fetch(`/api/agendamentos/${a.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    router.refresh();
  }

  async function marcarNoShow() {
    setLoadingId(a.id);
    await supabase.rpc("marcar_no_show", { p_agendamento_id: a.id });
    setLoadingId(null);
    router.refresh();
  }

  const loading = loadingId === a.id;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-semibold text-foreground">
          {a.clientes?.profiles?.nome} · {a.servicos?.nome}
        </p>
        <p className="text-sm text-muted-foreground">
          {new Date(a.data_hora).toLocaleString("pt-BR")} ·{" "}
          {a.clientes?.profiles?.telefone ?? "sem telefone"}
        </p>
        <Badge variant="outline" className="mt-1.5 uppercase tracking-widest text-gold">
          {STATUS_LABEL[a.status]}
        </Badge>
        {a.forma_pagamento && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Pagamento: {PAGAMENTO_LABEL[a.forma_pagamento] ?? a.forma_pagamento}{" "}
            {a.pagamento_antecipado ? "(antecipado, já pago)" : "(vai pagar no local)"}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/painel/barbeiro/comanda/${a.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Ver comanda
        </Link>
        {(a.status === "pendente" || a.status === "confirmado") && (
          <>
            {a.status === "pendente" && (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => atualizarStatus("confirmado")}
                className="rounded-full border-success/40 text-success hover:bg-success/10"
              >
                Confirmar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => atualizarStatus("concluido")}
              className="rounded-full border-gold/40 text-gold hover:bg-gold/10"
            >
              Concluir atendimento
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={marcarNoShow}
              className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Cliente não veio (no-show)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
