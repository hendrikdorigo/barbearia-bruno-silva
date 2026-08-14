"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Config = {
  id: string;
  meta_atendimentos: number;
  premio_descricao: string;
  ativo: boolean;
};

export default function FidelidadeEditor({
  barbeiroId,
  configsIniciais,
}: {
  barbeiroId: string;
  configsIniciais: Config[];
}) {
  const [configs, setConfigs] = useState<Config[]>(configsIniciais);
  const [meta, setMeta] = useState("10");
  const [premio, setPremio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    setErro(null);
    if (!premio || Number(meta) <= 0) {
      setErro("Preencha a meta e o prêmio.");
      return;
    }
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("fidelidade_config")
      .insert({ barbeiro_id: barbeiroId, meta_atendimentos: Number(meta), premio_descricao: premio })
      .select()
      .single();
    setSalvando(false);
    if (error || !salvo) {
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }
    setConfigs((prev) => [...prev, salvo as Config].sort((a, b) => a.meta_atendimentos - b.meta_atendimentos));
    setPremio("");
    router.refresh();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("fidelidade_config").update({ ativo: !ativo }).eq("id", id);
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ativo: !ativo } : c)));
    router.refresh();
  }

  async function remover(id: string) {
    await supabase.from("fidelidade_config").delete().eq("id", id);
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <Card className="border-border bg-ink-soft p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">A cada</span>
          <Input
            type="number"
            min="1"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            className="w-20 bg-background"
          />
          <span className="text-sm text-muted-foreground">atendimentos, o cliente ganha:</span>
        </div>
        <Input
          value={premio}
          onChange={(e) => setPremio(e.target.value)}
          placeholder="Ex: pomada de cabelo grátis"
          className="mt-3 bg-background"
        />
        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
        <Button onClick={adicionar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Adicionar conquista"}
        </Button>
      </Card>

      <div className="mt-5 space-y-2">
        {configs.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma conquista cadastrada ainda.</p>
        )}
        {configs.map((c) => (
          <Card
            key={c.id}
            className={cn(
              "flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3",
              !c.ativo && "border-border/40 bg-ink-soft/40"
            )}
          >
            <p className="text-sm font-semibold text-foreground">
              {c.meta_atendimentos} atendimentos → {c.premio_descricao}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => alternarAtivo(c.id, c.ativo)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full",
                  c.ativo
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                    : "border-success/40 text-success hover:bg-success/10"
                )}
              >
                {c.ativo ? "Desativar" : "Ativar"}
              </button>
              <button
                onClick={() => remover(c.id)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full hover:border-destructive/50 hover:text-destructive"
                )}
              >
                Remover
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
