"use client";

import { useMemo } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";
import type { Produto, Carrinho } from "@/lib/produtos-carrinho";
import { cn } from "@/lib/utils";

export default function ProdutoPicker({
  produtos,
  carrinho,
  onAlterar,
}: {
  produtos: Produto[];
  carrinho: Carrinho;
  onAlterar: (produtoId: string, delta: number) => void;
}) {
  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria || "outros"))),
    [produtos]
  );

  if (produtos.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">A loja ainda não tem produtos cadastrados.</p>;
  }

  return (
    <div className="mt-2">
      {categorias.map((cat) => (
        <div key={cat} className="mt-6 first:mt-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {produtos
              .filter((p) => (p.categoria || "outros") === cat)
              .map((p) => {
                const qtd = carrinho[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                      qtd > 0 ? "border-gold bg-gold/5" : "border-border bg-ink-soft"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {p.imagem_url && (
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border">
                          <Image src={p.imagem_url} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{p.nome}</p>
                        <p className="font-mono text-sm text-gold-gradient">
                          R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>

                    {qtd === 0 ? (
                      <button
                        onClick={() => onAlterar(p.id, 1)}
                        className="shrink-0 rounded-full border border-gold px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => onAlterar(p.id, -1)}
                          aria-label={`Remover ${p.nome}`}
                          className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm font-bold text-foreground">{qtd}</span>
                        <button
                          onClick={() => onAlterar(p.id, 1)}
                          aria-label={`Adicionar mais um ${p.nome}`}
                          className="flex size-7 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold/10"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
