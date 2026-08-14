"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/StarRating";

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
    <Card className="mt-6 border-border bg-ink-soft p-5">
      <p className="text-sm font-semibold text-foreground/90">Deixe sua avaliação</p>
      <div className="mt-2">
        <StarRating value={nota} onChange={setNota} size="md" />
      </div>
      <Textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Como foi sua experiência?"
        className="mt-3 bg-background"
        rows={3}
      />
      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
      <Button
        onClick={enviar}
        disabled={loading}
        size="sm"
        className="mt-3 uppercase tracking-widest"
      >
        {loading ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </Card>
  );
}
