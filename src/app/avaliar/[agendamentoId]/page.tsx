"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SparkleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import { cn } from "@/lib/utils";

const PRESETS = [
  "Corte impecável!",
  "Atendimento excelente",
  "Muito pontual",
  "Ambiente agradável",
  "Voltarei com certeza",
  "Superou minhas expectativas",
];

export default function AvaliarPage() {
  const { agendamentoId } = useParams<{ agendamentoId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [carregando, setCarregando] = useState(true);
  const [agendamento, setAgendamento] = useState<any>(null);
  const [jaAvaliado, setJaAvaliado] = useState(false);
  const [nota, setNota] = useState(5);
  const [presetSelecionado, setPresetSelecionado] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=/avaliar/${agendamentoId}`);
        return;
      }
      const { data: ag } = await supabase
        .from("agendamentos")
        .select("*, barbeiros(profile_id, profiles(nome)), servicos(nome)")
        .eq("id", agendamentoId)
        .single();
      setAgendamento(ag);

      const { data: existente } = await supabase
        .from("feedbacks")
        .select("id")
        .eq("agendamento_id", agendamentoId)
        .eq("cliente_id", user.id)
        .maybeSingle();
      setJaAvaliado(Boolean(existente));
      setCarregando(false);
    }
    carregar();
  }, [agendamentoId, router, supabase]);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !agendamento) {
      setErro("Não foi possível identificar o agendamento.");
      setEnviando(false);
      return;
    }
    const comentarioFinal = [presetSelecionado, comentario].filter(Boolean).join(" — ") || null;
    const { error } = await supabase.from("feedbacks").insert({
      barbeiro_id: agendamento.barbeiros.profile_id,
      cliente_id: user.id,
      agendamento_id: agendamentoId,
      nota,
      comentario: comentarioFinal,
      comentario_preset: presetSelecionado,
    });
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEnviado(true);
  }

  if (carregando) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!agendamento) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
        Agendamento não encontrado.
      </div>
    );
  }

  if (jaAvaliado || enviado) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <SparkleIcon className="mx-auto size-8 text-gold" />
        <p className="mt-3 font-display text-3xl text-foreground">Obrigado!</p>
        <p className="mt-3 text-muted-foreground">
          Sua avaliação foi registrada no perfil de{" "}
          {agendamento.barbeiros?.profiles?.nome}.
        </p>
        <Button onClick={() => router.push("/painel/cliente")} className="mt-6 uppercase tracking-widest">
          Voltar ao painel
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        {agendamento.servicos?.nome}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground">
        Como foi com {agendamento.barbeiros?.profiles?.nome}?
      </h1>

      <div className="mt-8 flex justify-center">
        <StarRating value={nota} onChange={setNota} />
      </div>

      <p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">
        Comentário rápido (opcional)
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPresetSelecionado(presetSelecionado === p ? null : p)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              presetSelecionado === p
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <Textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escreva seu próprio comentário (opcional)"
        rows={3}
        className="mt-4 bg-ink-soft"
      />

      {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}

      <Button onClick={enviar} disabled={enviando} className="mt-6 w-full uppercase tracking-widest">
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </div>
  );
}
