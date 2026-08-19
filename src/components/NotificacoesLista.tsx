"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BellIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export default function NotificacoesLista({ notificacoes }: { notificacoes: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Record<string, string>>({});

  useEffect(() => {
    const idsNaoLidas = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidas.length > 0) {
      supabase.from("notificacoes").update({ lida: true }).in("id", idsNaoLidas).then();
    }
  }, [notificacoes, supabase]);

  async function aceitarVaga(filaId: string) {
    setProcessando(filaId);
    const { error } = await supabase.rpc("aceitar_vaga_fila", { p_fila_id: filaId });
    setProcessando(null);
    setResultado((prev) => ({
      ...prev,
      [filaId]: error ? error.message : "Vaga confirmada! Veja em Meus agendamentos.",
    }));
    if (!error) router.refresh();
  }

  return (
    <div className="mt-8 space-y-3">
      {notificacoes.length === 0 && (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma notificação por enquanto</EmptyTitle>
            <EmptyDescription>Avisos de agendamento e fila de espera aparecem aqui.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {notificacoes.map((n) => (
        <Card
          key={n.id}
          className={cn(
            "gap-0 border p-4",
            n.lida ? "border-border bg-ink-soft" : "border-gold/40 bg-gold/10"
          )}
        >
          <p className="text-sm font-semibold text-foreground">{n.titulo}</p>
          <p className="mt-1 text-sm text-muted-foreground">{n.mensagem}</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            {new Date(n.created_at).toLocaleString("pt-BR")}
          </p>

          {n.tipo === "vaga_liberada" && n.referencia_id && !resultado[n.referencia_id] && (
            <Button
              onClick={() => aceitarVaga(n.referencia_id)}
              disabled={processando === n.referencia_id}
              size="sm"
              className="mt-3 w-fit uppercase tracking-widest"
            >
              {processando === n.referencia_id ? "Confirmando..." : "Aceitar esta vaga"}
            </Button>
          )}
          {n.referencia_id && resultado[n.referencia_id] && (
            <p className="mt-2 text-xs text-gold">{resultado[n.referencia_id]}</p>
          )}

          {n.tipo === "avaliacao" && n.referencia_id && (
            <Link
              href={`/avaliar/${n.referencia_id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 w-fit border-gold uppercase tracking-widest text-gold hover:bg-gold/10"
              )}
            >
              Avaliar atendimento
            </Link>
          )}

          {n.tipo === "novo_agendamento" && (
            <Link
              href="/painel/barbeiro"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 w-fit border-gold uppercase tracking-widest text-gold hover:bg-gold/10"
              )}
            >
              Ver agenda
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}
