"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, NotebookTextIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Nota = {
  id: string;
  texto: string;
  created_at: string;
  profiles: { nome: string } | null;
};

// Ficha do cliente: qualquer barbeiro/admin pode ler e adicionar registros
// (compartilhado entre a equipe). Aparece na comanda (na hora do
// atendimento), mas pode ser editada a qualquer momento a partir dali.
export default function FichaCliente({
  clienteId,
  notasIniciais,
  qtdNoShow,
  autorId,
}: {
  clienteId: string;
  notasIniciais: Nota[];
  qtdNoShow: number;
  autorId: string;
}) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function adicionar() {
    if (!texto.trim()) return;
    setSalvando(true);
    const { data, error } = await supabase
      .from("cliente_notas")
      .insert({ cliente_id: clienteId, autor_id: autorId, texto: texto.trim() })
      .select("id, texto, created_at, profiles(nome)")
      .single();
    setSalvando(false);
    if (!error && data) {
      setNotas((prev) => [data as any, ...prev]);
      setTexto("");
      router.refresh();
    }
  }

  return (
    <Card className="mt-6 border-border bg-ink-soft p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <NotebookTextIcon className="size-4" />
        Ficha do cliente
      </p>

      {qtdNoShow > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>
            Já não compareceu {qtdNoShow} {qtdNoShow === 1 ? "vez" : "vezes"} antes.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex: último corte navalhado nas laterais, gosta de conversar, prefere de manhã..."
          className="bg-background"
          rows={2}
        />
        <Button
          onClick={adicionar}
          disabled={salvando || !texto.trim()}
          size="sm"
          className="w-fit uppercase tracking-widest"
        >
          {salvando ? "Salvando..." : "Adicionar registro"}
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {notas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        )}
        {notas.map((n) => (
          <div key={n.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm text-foreground/90">{n.texto}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {n.profiles?.nome ?? "Equipe"} ·{" "}
              {new Date(n.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
