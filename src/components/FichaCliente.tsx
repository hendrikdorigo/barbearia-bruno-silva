"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, NotebookTextIcon, ShieldOffIcon, ShieldCheckIcon, PackageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pacoteVigente, textoDiasSemana, pacoteTemRateio, valorPorVisita, type PacoteCliente } from "@/lib/pacotes-cliente";
import { cn } from "@/lib/utils";

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
  bloqueadoInicial,
  motivoBloqueioInicial,
  pacotes,
}: {
  clienteId: string;
  notasIniciais: Nota[];
  qtdNoShow: number;
  autorId: string;
  bloqueadoInicial: boolean;
  motivoBloqueioInicial: string | null;
  pacotes: PacoteCliente[];
}) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [bloqueado, setBloqueado] = useState(bloqueadoInicial);
  const [motivoBloqueio, setMotivoBloqueio] = useState(motivoBloqueioInicial ?? "");
  const [alterandoBloqueio, setAlterandoBloqueio] = useState(false);
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

  async function alternarBloqueio() {
    const novoBloqueado = !bloqueado;
    if (
      novoBloqueado &&
      !window.confirm("Bloquear este cliente? Ele não vai conseguir marcar novos horários pelo site.")
    ) {
      return;
    }
    setAlterandoBloqueio(true);
    const { error } = await supabase
      .from("clientes")
      .update({
        bloqueado: novoBloqueado,
        motivo_bloqueio: novoBloqueado ? motivoBloqueio.trim() || null : null,
      })
      .eq("profile_id", clienteId);
    setAlterandoBloqueio(false);
    if (!error) {
      setBloqueado(novoBloqueado);
      if (!novoBloqueado) setMotivoBloqueio("");
      router.refresh();
    }
  }

  return (
    <Card className="mt-6 border-border bg-ink-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <NotebookTextIcon className="size-4" />
          Ficha do cliente
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={alterandoBloqueio}
          onClick={alternarBloqueio}
          className={cn(
            "rounded-full",
            bloqueado
              ? "border-success/40 text-success hover:bg-success/10"
              : "border-destructive/40 text-destructive hover:bg-destructive/10"
          )}
        >
          {bloqueado ? (
            <ShieldCheckIcon className="size-3.5" data-icon="inline-start" />
          ) : (
            <ShieldOffIcon className="size-3.5" data-icon="inline-start" />
          )}
          {bloqueado ? "Desbloquear cliente" : "Bloquear cliente"}
        </Button>
      </div>

      {bloqueado && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="flex items-center gap-2">
            <ShieldOffIcon className="size-4 shrink-0" />
            Cliente bloqueado — não consegue marcar horário pelo site.
          </span>
          {motivoBloqueio && <span className="text-destructive/80">Motivo: {motivoBloqueio}</span>}
        </div>
      )}

      {!bloqueado && (
        <Textarea
          value={motivoBloqueio}
          onChange={(e) => setMotivoBloqueio(e.target.value)}
          placeholder="Motivo do bloqueio, se for bloquear (opcional)"
          className="mt-3 bg-background"
          rows={1}
        />
      )}

      {qtdNoShow > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>
            Já não compareceu {qtdNoShow} {qtdNoShow === 1 ? "vez" : "vezes"} antes.
          </span>
        </div>
      )}

      {pacotes.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {pacotes.map((p) => (
            <div key={p.id} className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <PackageIcon className="size-3.5 text-gold" />
                  {p.nome}
                </span>
                <Badge variant="outline" className={pacoteVigente(p) ? "text-success" : "text-muted-foreground"}>
                  {pacoteVigente(p) ? "Vigente" : "Fora da validade"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Válido: {textoDiasSemana(p.dias_semana)}</p>
              {pacoteTemRateio(p) && (
                <p className="mt-0.5 font-mono text-xs text-gold">
                  {p.visitas_usadas} de {p.qtd_visitas_incluidas} usadas · R$ {valorPorVisita(p).toFixed(2).replace(".", ",")}/visita
                </p>
              )}
            </div>
          ))}
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
