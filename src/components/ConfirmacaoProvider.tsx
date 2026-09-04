"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type OpcoesConfirmacao = {
  titulo: string;
  descricao?: string;
  /** Texto do botão que confirma (padrão "Confirmar"). */
  confirmar?: string;
  /** Deixa o botão de confirmar vermelho, para ações que não dão pra desfazer. */
  destrutivo?: boolean;
};

type PedidoConfirmacao = OpcoesConfirmacao & { resolver: (ok: boolean) => void };

const ConfirmacaoContext = createContext<((opcoes: OpcoesConfirmacao) => Promise<boolean>) | null>(
  null
);

/**
 * Substitui o window.confirm() nativo (aquele popup cinza do navegador, que
 * não dá pra estilizar e trava a aba) por um diálogo no visual do site.
 * Como devolve Promise<boolean>, o uso fica igual ao confirm de antes:
 *
 *   const confirmar = useConfirmacao();
 *   if (!(await confirmar({ titulo: "Excluir?" }))) return;
 */
export function ConfirmacaoProvider({ children }: { children: React.ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  // Guarda o resolve pendente pra garantir que ele sempre seja chamado, mesmo
  // se o diálogo for fechado pelo Esc/clique fora em vez dos botões - senão a
  // Promise ficaria pendurada pra sempre e a ação travaria em silêncio.
  const pendenteRef = useRef<((ok: boolean) => void) | null>(null);

  const confirmar = useCallback((opcoes: OpcoesConfirmacao) => {
    return new Promise<boolean>((resolve) => {
      pendenteRef.current = resolve;
      setPedido({ ...opcoes, resolver: resolve });
    });
  }, []);

  function responder(ok: boolean) {
    pendenteRef.current?.(ok);
    pendenteRef.current = null;
    setPedido(null);
  }

  return (
    <ConfirmacaoContext.Provider value={confirmar}>
      {children}
      <Dialog open={pedido !== null} onOpenChange={(aberto) => !aberto && responder(false)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pedido?.destrutivo && <AlertTriangleIcon className="size-4 shrink-0 text-destructive" />}
              {pedido?.titulo}
            </DialogTitle>
            {pedido?.descricao && <DialogDescription>{pedido.descricao}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => responder(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={pedido?.destrutivo ? "destructive" : "default"}
              onClick={() => responder(true)}
            >
              {pedido?.confirmar ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao() {
  const ctx = useContext(ConfirmacaoContext);
  if (!ctx) {
    throw new Error("useConfirmacao precisa estar dentro de <ConfirmacaoProvider>");
  }
  return ctx;
}
