"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Item = { id: string; url: string; legenda: string | null };

/** Grade de fotos do portfólio - clicar numa foto amplia num lightbox, com
 * setas pra passar pras próximas sem precisar fechar e abrir de novo. */
export default function PortfolioGaleria({ itens }: { itens: Item[] }) {
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null);
  const itemAtual = indiceAberto !== null ? itens[indiceAberto] : null;

  function anterior() {
    setIndiceAberto((i) => (i === null ? null : (i - 1 + itens.length) % itens.length));
  }
  function proximo() {
    setIndiceAberto((i) => (i === null ? null : (i + 1) % itens.length));
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {itens.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndiceAberto(i)}
            className="flex flex-col gap-1.5 text-left"
          >
            <div className="relative h-32 overflow-hidden rounded-xl border border-border transition-opacity hover:opacity-80">
              <Image src={item.url} alt={item.legenda ?? ""} fill className="object-cover" />
            </div>
            {item.legenda && <p className="text-xs text-muted-foreground">{item.legenda}</p>}
          </button>
        ))}
      </div>

      <Dialog open={itemAtual !== null} onOpenChange={(v) => !v && setIndiceAberto(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-xl">
          <DialogTitle className="sr-only">Foto do portfólio</DialogTitle>
          {itemAtual && (
            <div className="flex flex-col gap-3">
              <div className="relative flex max-h-[75vh] items-center justify-center overflow-hidden rounded-xl bg-ink">
                <img
                  src={itemAtual.url}
                  alt={itemAtual.legenda ?? ""}
                  className="max-h-[75vh] w-full object-contain"
                />
              </div>
              {itemAtual.legenda && (
                <p className="text-center text-sm text-white/80">{itemAtual.legenda}</p>
              )}
              {itens.length > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={anterior}
                    aria-label="Foto anterior"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:border-gold hover:text-gold"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <span className="text-xs text-white/60">
                    {indiceAberto! + 1} / {itens.length}
                  </span>
                  <button
                    type="button"
                    onClick={proximo}
                    aria-label="Próxima foto"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:border-gold hover:text-gold"
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
