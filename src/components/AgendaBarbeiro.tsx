"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

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
    await fetch(`/api/agendamentos/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
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
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDaysIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum agendamento por enquanto</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
      {agendamentos.map((a) => (
        <Card key={a.id} className="gap-0 border-border bg-ink-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                      disabled={loadingId === a.id}
                      onClick={() => atualizarStatus(a.id, "confirmado")}
                      className="rounded-full border-success/40 text-success hover:bg-success/10"
                    >
                      Confirmar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingId === a.id}
                    onClick={() => atualizarStatus(a.id, "concluido")}
                    className="rounded-full border-gold/40 text-gold hover:bg-gold/10"
                  >
                    Concluir atendimento
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingId === a.id}
                    onClick={() => marcarNoShow(a.id)}
                    className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    Cliente não veio (no-show)
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
