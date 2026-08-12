"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificacoesLista({ notificacoes }: { notificacoes: any[] }) {
  const supabase = createClient();

  useEffect(() => {
    const idsNaoLidas = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (idsNaoLidas.length > 0) {
      supabase.from("notificacoes").update({ lida: true }).in("id", idsNaoLidas).then();
    }
  }, [notificacoes, supabase]);

  return (
    <div className="mt-8 space-y-3">
      {notificacoes.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhuma notificação por enquanto.</p>
      )}
      {notificacoes.map((n) => (
        <div
          key={n.id}
          className={`rounded-xl border p-4 ${
            n.lida ? "border-ink-line bg-ink-soft" : "border-gold/40 bg-gold/10"
          }`}
        >
          <p className="text-sm font-semibold text-neutral-100">{n.titulo}</p>
          <p className="mt-1 text-sm text-neutral-400">{n.mensagem}</p>
          <p className="mt-2 text-xs text-neutral-600">
            {new Date(n.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      ))}
    </div>
  );
}
