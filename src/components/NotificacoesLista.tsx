"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

          {n.tipo === "vaga_liberada" && n.referencia_id && !resultado[n.referencia_id] && (
            <button
              onClick={() => aceitarVaga(n.referencia_id)}
              disabled={processando === n.referencia_id}
              className="mt-3 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
            >
              {processando === n.referencia_id ? "Confirmando..." : "Aceitar esta vaga"}
            </button>
          )}
          {n.referencia_id && resultado[n.referencia_id] && (
            <p className="mt-2 text-xs text-gold">{resultado[n.referencia_id]}</p>
          )}

          {n.tipo === "avaliacao" && n.referencia_id && (
            <Link
              href={`/avaliar/${n.referencia_id}`}
              className="mt-3 inline-block rounded-full border border-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/10"
            >
              Avaliar atendimento
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
