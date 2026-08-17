"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      // O Postgres devolve o horario como "09:00:00" (com segundos), mas
      // <input type="time"> so aceita "09:00" - sem isso o campo aparecia
      // vazio toda vez que a pagina recarregava com horarios ja salvos.
      return existente
        ? {
            ...existente,
            hora_inicio: existente.hora_inicio.slice(0, 5),
            hora_fim: existente.hora_fim.slice(0, 5),
          }
        : {
            id: "",
            dia_semana: d.dia,
            ativo: d.dia !== 0,
            hora_inicio: "09:00",
            hora_fim: "19:30",
          };
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
          <Card
            key={dia}
            className={cn(
              "flex-row flex-wrap items-center gap-4 border-border bg-ink-soft px-4 py-3",
              !h.ativo && "bg-ink-soft/40"
            )}
          >
            <label className="flex w-32 items-center gap-2.5 text-sm font-semibold text-foreground/90">
              <Switch
                checked={h.ativo}
                onCheckedChange={(checked) => atualizar(dia, "ativo", checked)}
              />
              {label}
            </label>

            {h.ativo ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Input
                  type="time"
                  value={h.hora_inicio}
                  onChange={(e) => atualizar(dia, "hora_inicio", e.target.value)}
                  className="w-auto bg-background"
                />
                <span>até</span>
                <Input
                  type="time"
                  value={h.hora_fim}
                  onChange={(e) => atualizar(dia, "hora_fim", e.target.value)}
                  className="w-auto bg-background"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado nesse dia</span>
            )}
          </Card>
        );
      })}

      {mensagem && <p className="text-sm text-gold">{mensagem}</p>}

      <Button onClick={salvar} disabled={salvando} className="mt-2 w-fit uppercase tracking-widest">
        {salvando ? "Salvando..." : "Salvar horários"}
      </Button>
    </div>
  );
}
