"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { CalendarOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <Card className="border-border bg-ink-soft p-5">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">
          Data específica
        </label>
        <Input
          type="date"
          value={data}
          min={hoje}
          onChange={(e) => setData(e.target.value)}
          className="mt-2 h-11 bg-background"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTipo("folga")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              tipo === "folga"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Folga (fechado)
          </button>
          <button
            onClick={() => setTipo("customizado")}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              tipo === "customizado"
                ? "border-gold bg-gold-gradient text-ink"
                : "border-border text-muted-foreground hover:border-gold"
            )}
          >
            Horário diferente
          </button>
        </div>

        {tipo === "customizado" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-auto bg-background"
            />
            <span>até</span>
            <Input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              className="w-auto bg-background"
            />
          </div>
        )}

        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional) — ex: consulta médica, viagem..."
          className="mt-3 bg-background"
        />

        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

        <Button onClick={adicionar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Salvar exceção"}
        </Button>
      </Card>

      <div className="mt-6 space-y-2">
        {futuras.length === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarOffIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhuma exceção futura</EmptyTitle>
              <EmptyDescription>
                Sua agenda segue os horários padrão de cada dia da semana.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {futuras.map((e) => (
          <Card
            key={e.id}
            className="flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {new Date(`${e.data}T00:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  weekday: "short",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.ativo
                  ? `Horário diferente: ${e.hora_inicio?.slice(0, 5)} às ${e.hora_fim?.slice(0, 5)}`
                  : "Folga (fechado o dia todo)"}
                {e.motivo ? ` · ${e.motivo}` : ""}
              </p>
            </div>
            <button
              onClick={() => remover(e.id, e.data)}
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
  );
}
