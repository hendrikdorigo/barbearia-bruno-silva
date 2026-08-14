"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { processarPagamentoMock } from "@/lib/payments";
import { FORMAS_PAGAMENTO } from "@/lib/constants";

type Item = {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  produtos: { nome: string } | null;
};

type Comanda = {
  id: string;
  status: "aberta" | "aguardando_pagamento" | "paga" | "fechada";
  valor_servico: number;
  valor_produtos: number;
  forma_pagamento: string | null;
  pago_antecipado: boolean;
};

type Produto = { id: string; nome: string; preco: number; categoria: string | null };

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
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const total = Number(comanda.valor_servico) + itens.reduce((s, i) => s + i.quantidade * Number(i.preco_unitario), 0);
  const podeAdicionar = status === "aberta" || status === "aguardando_pagamento";

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

  async function pagarPeloApp() {
    setProcessando(true);
    setMensagem(null);
    const resultado = await processarPagamentoMock(formaPagamento as any, total);
    if (!resultado.aprovado) {
      setMensagem("Pagamento não aprovado, tente novamente.");
      setProcessando(false);
      return;
    }
    const { error } = await supabase
      .from("comandas")
      .update({ status: "paga", forma_pagamento: formaPagamento, pago_antecipado: true })
      .eq("id", comanda.id);
    setProcessando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setStatus("paga");
    setPagoAntecipado(true);
    setMensagem("Pagamento confirmado! Sua comanda será fechada ao final do atendimento.");
    router.refresh();
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
    <div className="mt-6 rounded-2xl border border-border bg-ink-soft p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">
          Comanda ·{" "}
          {status === "aberta" && "Em aberto"}
          {status === "aguardando_pagamento" && "Aguardando pagamento"}
          {status === "paga" && "Paga (aguardando fechamento)"}
          {status === "fechada" && "Fechada"}
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Serviço</span>
          <span>R$ {Number(comanda.valor_servico).toFixed(2).replace(".", ",")}</span>
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
                  className="text-xs text-muted-foreground/70 hover:text-destructive"
                >
                  remover
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-foreground">
          <span>Total</span>
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
                className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:border-gold disabled:opacity-50"
              >
                <p className="font-semibold text-foreground">{p.nome}</p>
                <p className="text-gold">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {podeAdicionar && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Forma de pagamento</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FORMAS_PAGAMENTO.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormaPagamento(f.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  formaPagamento === f.id
                    ? "border-gold bg-gold-gradient text-ink"
                    : "border-border text-muted-foreground hover:border-gold"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {papel === "cliente" && !pagoAntecipado && (
            <button
              onClick={pagarPeloApp}
              disabled={processando}
              className="mt-4 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
            >
              {processando ? "Processando..." : "Pagar agora pelo app"}
            </button>
          )}

          {papel === "barbeiro" && status === "aguardando_pagamento" && (
            <button
              onClick={confirmarPagamentoCaixa}
              disabled={processando}
              className="mt-4 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
            >
              {processando ? "Confirmando..." : "Confirmar pagamento no caixa e fechar comanda"}
            </button>
          )}

          {papel === "cliente" && pagoAntecipado && status !== "fechada" && (
            <p className="mt-4 rounded-lg border border-green-500/30 bg-success/10 p-3 text-sm text-green-300">
              Pago pelo app. Aguardando o barbeiro fechar a comanda ao fim do
              atendimento.
            </p>
          )}
        </div>
      )}

      {status === "fechada" && (
        <p className="mt-6 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
          Comanda fechada. Obrigado pela preferência!
        </p>
      )}

      {mensagem && <p className="mt-4 text-sm text-gold">{mensagem}</p>}
    </div>
  );
}
