"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-neutral-500">Carregando...</div>;
  }

  if (!agendamento) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-neutral-400">
        Agendamento não encontrado.
      </div>
    );
  }

  if (jaAvaliado || enviado) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-3xl text-neutral-50">Obrigado! ⭐</p>
        <p className="mt-3 text-neutral-400">
          Sua avaliação foi registrada no perfil de{" "}
          {agendamento.barbeiros?.profiles?.nome}.
        </p>
        <button
          onClick={() => router.push("/painel/cliente")}
          className="mt-6 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        {agendamento.servicos?.nome}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-neutral-50">
        Como foi com {agendamento.barbeiros?.profiles?.nome}?
      </h1>

      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            className={`text-4xl transition-transform hover:scale-110 ${
              n <= nota ? "text-gold" : "text-neutral-700"
            }`}
            aria-label={`${n} estrelas`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs uppercase tracking-widest text-neutral-500">
        Comentário rápido (opcional)
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPresetSelecionado(presetSelecionado === p ? null : p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              presetSelecionado === p
                ? "border-gold bg-gold-gradient text-ink"
                : "border-ink-line text-neutral-300 hover:border-gold"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escreva seu próprio comentário (opcional)"
        rows={3}
        className="mt-4 w-full rounded-lg border border-ink-line bg-ink-soft px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
      />

      {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

      <button
        onClick={enviar}
        disabled={enviando}
        className="mt-6 w-full rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </button>
    </div>
  );
}
