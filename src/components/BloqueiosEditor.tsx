"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <Card className="border-border bg-ink-soft p-5">
        <div className="flex gap-2">
          <button
            onClick={() => setRecorrencia("semanal")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              recorrencia === "semanal"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Toda semana (ex: almoço)
          </button>
          <button
            onClick={() => setRecorrencia("data")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              recorrencia === "data"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Data específica (compromisso)
          </button>
        </div>

        {recorrencia === "semanal" ? (
          <select
            value={diaSemana}
            onChange={(e) => setDiaSemana(Number(e.target.value))}
            className="mt-3 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-gold focus:outline-none"
          >
            {DIAS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type="date"
            value={data}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setData(e.target.value)}
            className="mt-3 h-11 bg-background"
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-auto min-w-0 bg-background"
          />
          <span>até</span>
          <Input
            type="time"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="w-auto min-w-0 bg-background"
          />
        </div>

        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: almoço, consulta..."
          className="mt-3 bg-background"
        />

        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

        <Button onClick={adicionar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Adicionar bloqueio"}
        </Button>
      </Card>

      {semanais.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Bloqueios semanais
          </p>
          <div className="mt-2 space-y-2">
            {semanais.map((b) => (
              <Card
                key={b.id}
                className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3"
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
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full hover:border-destructive/50 hover:text-destructive"
                  )}
                >
                  Remover
                </button>
              </Card>
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
              <Card
                key={b.id}
                className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3"
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
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-full hover:border-destructive/50 hover:text-destructive"
                  )}
                >
                  Remover
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
