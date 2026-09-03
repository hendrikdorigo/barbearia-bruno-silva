"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangleIcon, ShieldOffIcon } from "lucide-react";
import {
  nomeClienteAgendamento,
  telefoneClienteAgendamento,
  qtdNoShowAgendamento,
  clienteBloqueadoAgendamento,
} from "@/lib/cliente-agendamento";
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

export default function AgendamentoDetalhe({
  agendamento: a,
  mostrarLinkComanda = true,
}: {
  agendamento: any;
  mostrarLinkComanda?: boolean;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function atualizarStatus(status: string) {
    setLoadingId(a.id);
    setErro(null);
    const resp = await fetch(`/api/agendamentos/${a.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    if (!resp.ok) {
      const body = await resp.json().catch(() => null);
      setErro(body?.error ?? "Não foi possível atualizar o status.");
      return;
    }
    router.refresh();
  }

  async function marcarNoShow() {
    setLoadingId(a.id);
    setErro(null);
    const { error } = await supabase.rpc("marcar_no_show", { p_agendamento_id: a.id });
    setLoadingId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    fetch(`/api/agendamentos/${a.id}/notificar-no-show`, { method: "POST" }).catch(() => {});
    router.refresh();
  }

  const loading = loadingId === a.id;
  const qtdNoShow = qtdNoShowAgendamento(a);
  const bloqueado = clienteBloqueadoAgendamento(a);
  const itensComanda = a.comandas?.comanda_itens ?? [];
  const totalProdutos = itensComanda.reduce(
    (s: number, i: any) => s + i.quantidade * Number(i.preco_unitario),
    0
  );
  const totalGeral = Number(a.valor_servico) + totalProdutos;

  return (
    <div className="flex flex-col gap-3">
      {bloqueado && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldOffIcon className="size-4 shrink-0" />
          <span>Cliente bloqueado.</span>
        </div>
      )}
      {qtdNoShow > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>
            Cliente já não compareceu {qtdNoShow}{" "}
            {qtdNoShow === 1 ? "vez" : "vezes"} antes.
          </span>
        </div>
      )}
      <div>
        <p className="font-semibold text-foreground">
          {nomeClienteAgendamento(a)} · {a.servicos?.nome}
          {!a.cliente_id && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(avulso)</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {new Date(a.data_hora).toLocaleString("pt-BR")} · {telefoneClienteAgendamento(a) ?? "sem telefone"}
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
        <p className="mt-1.5 font-mono text-sm text-muted-foreground">
          Serviço: R$ {Number(a.valor_servico).toFixed(2).replace(".", ",")}
        </p>
        {itensComanda.length > 0 && (
          <div className="mt-2 rounded-lg border border-border bg-ink-soft px-3 py-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Produtos da loja</p>
            <div className="mt-1.5 flex flex-col gap-1 font-mono text-sm text-muted-foreground">
              {itensComanda.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {i.quantidade}x {i.produtos?.nome ?? "Produto"}
                  </span>
                  <span>R$ {(i.quantidade * Number(i.preco_unitario)).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 flex justify-between border-t border-border pt-1.5 font-mono text-sm font-semibold text-foreground">
              <span className="font-sans">Total (serviço + produtos)</span>
              <span className="text-gold-gradient">R$ {totalGeral.toFixed(2).replace(".", ",")}</span>
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {mostrarLinkComanda && (
          <Link
            href={`/painel/barbeiro/comanda/${a.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            Ver comanda
          </Link>
        )}
        {(a.status === "pendente" || a.status === "confirmado") && (
          <>
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
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                if (confirm("Recusar esse agendamento?")) atualizarStatus("cancelado");
              }}
              className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Recusar agendamento
            </Button>
          </>
        )}
      </div>
      {erro && (
        <p className="text-sm text-destructive">{erro}</p>
      )}
    </div>
  );
}
