"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackForm({ barbeiroId }: { barbeiroId: string }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function enviar() {
    setLoading(true);
    setErro(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErro("Você precisa estar logado.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("feedbacks").insert({
      barbeiro_id: barbeiroId,
      cliente_id: user.id,
      nota,
      comentario: comentario || null,
    });
    setLoading(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setComentario("");
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-xl border border-ink-line bg-ink-soft p-5">
      <p className="text-sm font-semibold text-neutral-200">Deixe sua avaliação</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            className={`text-2xl ${n <= nota ? "text-gold" : "text-neutral-700"}`}
            aria-label={`${n} estrelas`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Como foi sua experiência?"
        className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        rows={3}
      />
      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
      <button
        onClick={enviar}
        disabled={loading}
        className="mt-3 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar avaliação"}
      </button>
    </div>
  );
}
