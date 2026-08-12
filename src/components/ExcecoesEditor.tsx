"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Excecao = {
  id: string;
  data: string;
  ativo: boolean;
  hora_inicio: string | null;
  hora_fim: string | null;
  motivo: string | null;
};

export default function ExcecoesEditor({
  barbeiroId,
  excecoesIniciais,
}: {
  barbeiroId: string;
  excecoesIniciais: Excecao[];
}) {
  const [excecoes, setExcecoes] = useState<Excecao[]>(
    [...excecoesIniciais].sort((a, b) => a.data.localeCompare(b.data))
  );
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<"folga" | "customizado">("folga");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("19:30");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    setSalvando(true);

    const payload =
      tipo === "folga"
        ? {
            barbeiro_id: barbeiroId,
            data,
            ativo: false,
            hora_inicio: null,
            hora_fim: null,
            motivo: motivo || null,
          }
        : {
            barbeiro_id: barbeiroId,
            data,
            ativo: true,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            motivo: motivo || null,
          };

    const { data: salvo, error } = await supabase
      .from("barbeiro_excecoes")
      .upsert(payload, { onConflict: "barbeiro_id,data" })
      .select()
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar a exceção.");
      return;
    }

    setExcecoes((prev) => {
      const outros = prev.filter((e) => e.data !== data);
      return [...outros, salvo as Excecao].sort((a, b) => a.data.localeCompare(b.data));
    });
    setMotivo("");
    router.refresh();
  }

  async function remover(id: string, dataRemovida: string) {
    await supabase.from("barbeiro_excecoes").delete().eq("id", id);
    setExcecoes((prev) => prev.filter((e) => e.data !== dataRemovida));
    router.refresh();
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const futuras = excecoes.filter((e) => e.data >= hoje);

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-ink-line bg-ink-soft p-5">
        <label className="text-xs uppercase tracking-widest text-neutral-500">
          Data específica
        </label>
        <input
          type="date"
          value={data}
          min={hoje}
          onChange={(e) => setData(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-neutral-100 focus:border-gold focus:outline-none"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTipo("folga")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              tipo === "folga"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-ink-line text-neutral-300 hover:border-gold"
            }`}
          >
            Folga (fechado)
          </button>
          <button
            onClick={() => setTipo("customizado")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              tipo === "customizado"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-ink-line text-neutral-300 hover:border-gold"
            }`}
          >
            Horário diferente
          </button>
        </div>

        {tipo === "customizado" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-neutral-100 focus:border-gold focus:outline-none"
            />
            <span className="text-neutral-500">até</span>
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              className="rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-neutral-100 focus:border-gold focus:outline-none"
            />
          </div>
        )}

        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: consulta médica, viagem..."
          className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-2.5 text-sm text-neutral-100 focus:border-gold focus:outline-none"
        />

        {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

        <button
          onClick={adicionar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar exceção"}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {futuras.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nenhuma exceção futura cadastrada — sua agenda segue os horários
            padrão de cada dia da semana.
          </p>
        )}
        {futuras.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                {new Date(`${e.data}T00:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  weekday: "short",
                })}
              </p>
              <p className="text-xs text-neutral-400">
                {e.ativo
                  ? `Horário diferente: ${e.hora_inicio?.slice(0, 5)} às ${e.hora_fim?.slice(0, 5)}`
                  : "Folga (fechado o dia todo)"}
                {e.motivo ? ` · ${e.motivo}` : ""}
              </p>
            </div>
            <button
              onClick={() => remover(e.id, e.data)}
              className="rounded-full border border-ink-line px-3 py-1.5 text-xs font-bold uppercase text-neutral-400 hover:border-red-400 hover:text-red-400"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
