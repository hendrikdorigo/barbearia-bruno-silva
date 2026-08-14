"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DIAS = [
  { dia: 0, label: "Domingo" },
  { dia: 1, label: "Segunda" },
  { dia: 2, label: "Terça" },
  { dia: 3, label: "Quarta" },
  { dia: 4, label: "Quinta" },
  { dia: 5, label: "Sexta" },
  { dia: 6, label: "Sábado" },
] as const;

type Horario = {
  id: string;
  dia_semana: number;
  ativo: boolean;
  hora_inicio: string;
  hora_fim: string;
};

export default function HorariosEditor({
  barbeiroId,
  horariosIniciais,
}: {
  barbeiroId: string;
  horariosIniciais: Horario[];
}) {
  const [horarios, setHorarios] = useState<Horario[]>(
    DIAS.map((d) => {
      const existente = horariosIniciais.find((h) => h.dia_semana === d.dia);
      return (
        existente ?? {
          id: "",
          dia_semana: d.dia,
          ativo: d.dia !== 0,
          hora_inicio: "09:00",
          hora_fim: "19:30",
        }
      );
    })
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function atualizar(dia: number, campo: keyof Horario, valor: string | boolean) {
    setHorarios((prev) =>
      prev.map((h) => (h.dia_semana === dia ? { ...h, [campo]: valor } : h))
    );
  }

  async function salvar() {
    setSalvando(true);
    setMensagem(null);

    const linhas = horarios.map((h) => ({
      barbeiro_id: barbeiroId,
      dia_semana: h.dia_semana,
      ativo: h.ativo,
      hora_inicio: h.hora_inicio,
      hora_fim: h.hora_fim,
    }));

    const { error } = await supabase
      .from("barbeiro_horarios")
      .upsert(linhas, { onConflict: "barbeiro_id,dia_semana" });

    setSalvando(false);
    if (error) {
      setMensagem(error.message);
      return;
    }
    setMensagem("Horários atualizados!");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {DIAS.map(({ dia, label }) => {
        const h = horarios.find((x) => x.dia_semana === dia)!;
        return (
          <div
            key={dia}
            className={`flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 ${
              h.ativo ? "border-border bg-ink-soft" : "border-border/50 bg-ink-soft/40"
            }`}
          >
            <label className="flex w-32 items-center gap-2 text-sm font-semibold text-foreground/90">
              <input
                type="checkbox"
                checked={h.ativo}
                onChange={(e) => atualizar(dia, "ativo", e.target.checked)}
                className="h-4 w-4 accent-[#C9A227]"
              />
              {label}
            </label>

            {h.ativo ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="time"
                  value={h.hora_inicio}
                  onChange={(e) => atualizar(dia, "hora_inicio", e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:border-gold focus:outline-none"
                />
                <span className="text-muted-foreground">até</span>
                <input
                  type="time"
                  value={h.hora_fim}
                  onChange={(e) => atualizar(dia, "hora_fim", e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:border-gold focus:outline-none"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado nesse dia</span>
            )}
          </div>
        );
      })}

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-2 self-start rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar horários"}
      </button>
    </div>
  );
}
