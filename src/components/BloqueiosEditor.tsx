"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type Bloqueio = {
  id: string;
  dia_semana: number | null;
  data: string | null;
  hora_inicio: string;
  hora_fim: string;
  motivo: string | null;
};

export default function BloqueiosEditor({
  barbeiroId,
  bloqueiosIniciais,
}: {
  barbeiroId: string;
  bloqueiosIniciais: Bloqueio[];
}) {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>(bloqueiosIniciais);
  const [recorrencia, setRecorrencia] = useState<"semanal" | "data">("semanal");
  const [diaSemana, setDiaSemana] = useState(1);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaInicio, setHoraInicio] = useState("12:00");
  const [horaFim, setHoraFim] = useState("13:00");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    if (horaFim <= horaInicio) {
      setErro("O horário final precisa ser depois do inicial.");
      return;
    }
    setSalvando(true);

    const payload =
      recorrencia === "semanal"
        ? {
            barbeiro_id: barbeiroId,
            dia_semana: diaSemana,
            data: null,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            motivo: motivo || null,
          }
        : {
            barbeiro_id: barbeiroId,
            dia_semana: null,
            data,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            motivo: motivo || null,
          };

    const { data: salvo, error } = await supabase
      .from("barbeiro_bloqueios")
      .insert(payload)
      .select()
      .single();

    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar o bloqueio.");
      return;
    }
    setBloqueios((prev) => [...prev, salvo as Bloqueio]);
    setMotivo("");
    router.refresh();
  }

  async function remover(id: string) {
    await supabase.from("barbeiro_bloqueios").delete().eq("id", id);
    setBloqueios((prev) => prev.filter((b) => b.id !== id));
    router.refresh();
  }

  const semanais = bloqueios.filter((b) => b.dia_semana !== null);
  const especificos = [...bloqueios.filter((b) => b.data !== null)].sort((a, b) =>
    (a.data ?? "").localeCompare(b.data ?? "")
  );

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-border bg-ink-soft p-5">
        <div className="flex gap-2">
          <button
            onClick={() => setRecorrencia("semanal")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              recorrencia === "semanal"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            }`}
          >
            Toda semana (ex: almoço)
          </button>
          <button
            onClick={() => setRecorrencia("data")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${
              recorrencia === "data"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            }`}
          >
            Data específica (compromisso)
          </button>
        </div>

        {recorrencia === "semanal" ? (
          <select
            value={diaSemana}
            onChange={(e) => setDiaSemana(Number(e.target.value))}
            className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-gold focus:outline-none"
          >
            {DIAS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            value={data}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setData(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-gold focus:outline-none"
          />
        )}

        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:border-gold focus:outline-none"
          />
          <span className="text-muted-foreground">até</span>
          <input
            type="time"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:border-gold focus:outline-none"
          />
        </div>

        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: almoço, consulta..."
          className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
        />

        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

        <button
          onClick={adicionar}
          disabled={salvando}
          className="mt-4 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Adicionar bloqueio"}
        </button>
      </div>

      {semanais.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Bloqueios semanais
          </p>
          <div className="mt-2 space-y-2">
            {semanais.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-ink-soft px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {DIAS[b.dia_semana!]} · {b.hora_inicio.slice(0, 5)} às{" "}
                    {b.hora_fim.slice(0, 5)}
                  </p>
                  {b.motivo && <p className="text-xs text-muted-foreground">{b.motivo}</p>}
                </div>
                <button
                  onClick={() => remover(b.id)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground hover:border-red-400 hover:text-destructive"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {especificos.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Compromissos em datas específicas
          </p>
          <div className="mt-2 space-y-2">
            {especificos.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-ink-soft px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(`${b.data}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                    {b.hora_inicio.slice(0, 5)} às {b.hora_fim.slice(0, 5)}
                  </p>
                  {b.motivo && <p className="text-xs text-muted-foreground">{b.motivo}</p>}
                </div>
                <button
                  onClick={() => remover(b.id)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground hover:border-red-400 hover:text-destructive"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
