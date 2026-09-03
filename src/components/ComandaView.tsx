"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon, PencilIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  produtos: { nome: string } | null;
};

type Comanda = {
  id: string;
  agendamento_id: string;
  status: "aberta" | "aguardando_pagamento" | "paga" | "fechada" | "fiado";
  valor_servico: number;
  valor_produtos: number;
  forma_pagamento: string | null;
  pago_antecipado: boolean;
};

type Produto = { id: string; nome: string; preco: number; categoria: string | null };

const STATUS_LABEL: Record<Comanda["status"], string> = {
  aberta: "Em aberto",
  aguardando_pagamento: "Aguardando pagamento",
  paga: "Paga (aguardando fechamento)",
  fechada: "Fechada",
  fiado: "Fiado (a receber)",
};

export default function ComandaView({
  comanda,
  itensIniciais,
  produtos,
  papel,
}: {
  comanda: Comanda;
  itensIniciais: Item[];
  produtos: Produto[];
  papel: "cliente" | "barbeiro";
}) {
  const [itens, setItens] = useState<Item[]>(itensIniciais);
  const [status, setStatus] = useState(comanda.status);
  const [pagoAntecipado, setPagoAntecipado] = useState(comanda.pago_antecipado);
  const [formaPagamento, setFormaPagamento] = useState(comanda.forma_pagamento ?? "pix");
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [valorServico, setValorServico] = useState(Number(comanda.valor_servico));
  const [editandoValor, setEditandoValor] = useState(false);
  const [valorEditado, setValorEditado] = useState(String(comanda.valor_servico));
  const [salvandoValor, setSalvandoValor] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const total = valorServico + itens.reduce((s, i) => s + i.quantidade * Number(i.preco_unitario), 0);
  const podeAdicionar = status === "aberta" || status === "aguardando_pagamento";
  const podePagar = status === "aguardando_pagamento" || status === "fiado";

  async function salvarValorServico() {
    const novoValor = Number(valorEditado);
    if (Number.isNaN(novoValor) || novoValor < 0) return;
    setSalvandoValor(true);
    const [{ error: erroComanda }, { error: erroAgendamento }] = await Promise.all([
      supabase.from("comandas").update({ valor_servico: novoValor }).eq("id", comanda.id),
      supabase.from("agendamentos").update({ valor_servico: novoValor }).eq("id", comanda.agendamento_id),
    ]);
    setSalvandoValor(false);
    if (!erroComanda && !erroAgendamento) {
      setValorServico(novoValor);
      setEditandoValor(false);
      router.refresh();
    }
  }

  async function adicionarProduto(produto: Produto) {
    setAdicionando(produto.id);
    const { data: salvo, error } = await supabase
      .from("comanda_itens")
      .insert({ comanda_id: comanda.id, produto_id: produto.id, quantidade: 1, preco_unitario: produto.preco })
      .select("id, produto_id, quantidade, preco_unitario, produtos(nome)")
      .single();
    setAdicionando(null);
    if (!error && salvo) {
      setItens((prev) => [...prev, salvo as any]);
      router.refresh();
    }
  }

  async function removerItem(itemId: string) {
    await supabase.from("comanda_itens").delete().eq("id", itemId);
    setItens((prev) => prev.filter((i) => i.id !== itemId));
    router.refresh();
  }

  async function deixarFiado() {
    if (!window.confirm("Deixar esse valor em aberto? O cliente vai poder pagar depois.")) return;
    setProcessando(true);
    const { error } = await supabase.from("comandas").update({ status: "fiado" }).eq("id", comanda.id);
    setProcessando(false);
    if (!error) {
      setStatus("fiado");
      router.refresh();
    }
  }

  async function confirmarPagamentoCaixa() {
    setProcessando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("comandas")
      .update({
        status: "fechada",
        confirmado_caixa_em: new Date().toISOString(),
        confirmado_caixa_por: userData.user?.id,
        forma_pagamento: formaPagamento,
      })
      .eq("id", comanda.id);
    setProcessando(false);
    if (!error) {
      setStatus("fechada");
      router.refresh();
    }
  }

  return (
    <Card className="mt-6 gap-0 border-border bg-ink-soft p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">Comanda</p>
        <Badge variant="outline">{STATUS_LABEL[status]}</Badge>
      </div>

      <div className="mt-4 space-y-2 font-mono text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Serviço</span>
          {editandoValor ? (
            <span className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0"
                step="0.5"
                autoFocus
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="h-7 w-24 bg-background text-right font-mono"
              />
              <Button
                size="sm"
                disabled={salvandoValor}
                onClick={salvarValorServico}
                className="h-7 px-2 text-xs uppercase tracking-widest"
              >
                OK
              </Button>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              R$ {valorServico.toFixed(2).replace(".", ",")}
              {podeAdicionar && papel === "barbeiro" && (
                <button
                  onClick={() => {
                    setValorEditado(String(valorServico));
                    setEditandoValor(true);
                  }}
                  aria-label="Editar valor do serviço"
                  className="text-muted-foreground/70 hover:text-gold"
                >
                  <PencilIcon className="size-3" />
                </button>
              )}
            </span>
          )}
        </div>
        {itens.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-muted-foreground">
            <span>
              {i.quantidade}x {i.produtos?.nome ?? "Produto"}
            </span>
            <div className="flex items-center gap-2">
              <span>R$ {(i.quantidade * Number(i.preco_unitario)).toFixed(2).replace(".", ",")}</span>
              {podeAdicionar && (
                <button
                  onClick={() => removerItem(i.id)}
                  aria-label="Remover item"
                  className="text-muted-foreground/70 hover:text-destructive"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-foreground">
          <span className="font-sans">Total</span>
          <span className="text-gold-gradient">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      {podeAdicionar && produtos.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Adicionar da loja
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {produtos.map((p) => (
              <button
                key={p.id}
                onClick={() => adicionarProduto(p)}
                disabled={adicionando === p.id}
                className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-gold disabled:opacity-50"
              >
                <p className="font-semibold text-foreground">{p.nome}</p>
                <p className="font-mono text-gold">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "fiado" && (
        <Alert className="mt-6 border-amber-500/40 bg-amber-500/10">
          <AlertDescription className="text-amber-400">
            {papel === "barbeiro"
              ? "Fiado — o cliente ainda não pagou esse atendimento."
              : "Você ainda não pagou esse atendimento. Pode quitar na barbearia quando puder."}
          </AlertDescription>
        </Alert>
      )}

      {(podeAdicionar || status === "fiado") && (
        <div className="mt-6">
          {papel === "barbeiro" && podePagar && (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Forma de pagamento</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {FORMAS_PAGAMENTO.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormaPagamento(f.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                      formaPagamento === f.id
                        ? "border-gold bg-gold-gradient text-ink"
                        : "border-border text-muted-foreground hover:border-gold"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {papel === "barbeiro" && podePagar && (
            <Button
              onClick={confirmarPagamentoCaixa}
              disabled={processando}
              className="mt-4 w-full uppercase tracking-widest"
            >
              {processando
                ? "Confirmando..."
                : status === "fiado"
                  ? "Marcar como pago agora"
                  : "Confirmar pagamento no caixa e fechar comanda"}
            </Button>
          )}

          {papel === "barbeiro" && status === "aguardando_pagamento" && (
            <Button
              onClick={deixarFiado}
              disabled={processando}
              variant="outline"
              className="mt-2 w-full uppercase tracking-widest"
            >
              Deixar fiado (cliente paga depois)
            </Button>
          )}

          {papel === "cliente" && pagoAntecipado && status !== "fechada" && (
            <Alert className="mt-4 border-success/30 bg-success/10">
              <AlertDescription className="text-success">
                Pago pelo app. Aguardando o barbeiro fechar a comanda ao fim do
                atendimento.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {status === "fechada" && (
        <Alert className="mt-6 border-gold/30 bg-gold/10">
          <AlertDescription className="text-gold">
            Comanda fechada. Obrigado pela preferência!
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
