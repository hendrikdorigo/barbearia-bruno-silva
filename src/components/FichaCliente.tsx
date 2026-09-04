"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  ImageIcon,
  NotebookTextIcon,
  PackageIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  Trash2Icon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pacoteVigente, textoDiasSemana, pacoteTemRateio, valorPorVisita, type PacoteCliente } from "@/lib/pacotes-cliente";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";
import { cn } from "@/lib/utils";

type Nota = {
  id: string;
  texto: string;
  imagem_url: string | null;
  created_at: string;
  autor_id: string;
  profiles: { nome: string } | null;
};

// Ficha do cliente: qualquer barbeiro/admin pode ler e adicionar registros
// (compartilhado entre a equipe). Aparece na comanda (na hora do
// atendimento), mas pode ser editada a qualquer momento a partir dali.
export default function FichaCliente({
  clienteId,
  notasIniciais,
  notasAvulsoAntigas,
  qtdNoShow,
  autorId,
  bloqueadoInicial,
  motivoBloqueioInicial,
  pacotes,
  valorFiadoAberto,
}: {
  clienteId: string;
  notasIniciais: Nota[];
  notasAvulsoAntigas?: Nota[];
  qtdNoShow: number;
  autorId: string;
  bloqueadoInicial: boolean;
  motivoBloqueioInicial: string | null;
  pacotes: PacoteCliente[];
  valorFiadoAberto?: number;
}) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [imagemNova, setImagemNova] = useState<File | null>(null);
  const [previewNova, setPreviewNova] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [bloqueado, setBloqueado] = useState(bloqueadoInicial);
  const [motivoBloqueio, setMotivoBloqueio] = useState(motivoBloqueioInicial ?? "");
  const [alterandoBloqueio, setAlterandoBloqueio] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const inputImagemNova = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function enviarImagem(arquivo: File) {
    const path = `${clienteId}/${Date.now()}-${arquivo.name}`;
    const { error } = await supabase.storage.from("cliente-notas").upload(path, arquivo);
    if (error) return null;
    return supabase.storage.from("cliente-notas").getPublicUrl(path).data.publicUrl;
  }

  function escolherImagemNova(arquivo: File | null) {
    setImagemNova(arquivo);
    setPreviewNova(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  async function adicionar() {
    if (!texto.trim() && !imagemNova) return;
    setSalvando(true);
    const imagemUrl = imagemNova ? await enviarImagem(imagemNova) : null;
    const { data, error } = await supabase
      .from("cliente_notas")
      .insert({ cliente_id: clienteId, autor_id: autorId, texto: texto.trim(), imagem_url: imagemUrl })
      .select("id, texto, imagem_url, created_at, autor_id, profiles(nome)")
      .single();
    setSalvando(false);
    if (!error && data) {
      setNotas((prev) => [data as any, ...prev]);
      setTexto("");
      escolherImagemNova(null);
      router.refresh();
    }
  }

  function iniciarEdicao(nota: Nota) {
    setEditandoId(nota.id);
    setTextoEditado(nota.texto);
  }

  async function salvarEdicao(notaId: string) {
    if (!textoEditado.trim()) return;
    const { error } = await supabase
      .from("cliente_notas")
      .update({ texto: textoEditado.trim() })
      .eq("id", notaId);
    if (!error) {
      setNotas((prev) => prev.map((n) => (n.id === notaId ? { ...n, texto: textoEditado.trim() } : n)));
      setEditandoId(null);
      router.refresh();
    }
  }

  async function excluir(notaId: string) {
    const ok = await confirmar({
      titulo: "Excluir este registro?",
      confirmar: "Excluir",
      destrutivo: true,
    });
    if (!ok) return;
    setExcluindoId(notaId);
    const { error } = await supabase.from("cliente_notas").delete().eq("id", notaId);
    setExcluindoId(null);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    setNotas((prev) => prev.filter((n) => n.id !== notaId));
    toast.success("Registro excluído.");
    router.refresh();
  }

  async function alternarBloqueio() {
    const novoBloqueado = !bloqueado;
    if (novoBloqueado) {
      const ok = await confirmar({
        titulo: "Bloquear este cliente?",
        descricao: "Ele não vai conseguir marcar novos horários pelo site.",
        confirmar: "Bloquear",
        destrutivo: true,
      });
      if (!ok) return;
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
    if (error) {
      toast.error("Não foi possível alterar o bloqueio", { description: error.message });
    }
    if (!error) {
      setBloqueado(novoBloqueado);
      if (!novoBloqueado) setMotivoBloqueio("");
      toast.success(novoBloqueado ? "Cliente bloqueado." : "Cliente desbloqueado.");
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

      {Boolean(valorFiadoAberto && valorFiadoAberto > 0) && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          <WalletIcon className="size-4 shrink-0" />
          <span>
            Fiado em aberto com você: R$ {valorFiadoAberto!.toFixed(2).replace(".", ",")}
          </span>
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
        {previewNova && (
          <div className="relative w-fit">
            <img src={previewNova} alt="" className="h-24 w-24 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => escolherImagemNova(null)}
              aria-label="Remover imagem"
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputImagemNova.current?.click()}
            className="w-fit uppercase tracking-widest"
          >
            <ImageIcon className="size-3.5" data-icon="inline-start" />
            {previewNova ? "Trocar foto" : "Anexar foto"}
          </Button>
          <input
            ref={inputImagemNova}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => escolherImagemNova(e.target.files?.[0] ?? null)}
          />
          <Button
            onClick={adicionar}
            disabled={salvando || (!texto.trim() && !imagemNova)}
            size="sm"
            className="w-fit uppercase tracking-widest"
          >
            {salvando ? "Salvando..." : "Adicionar registro"}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {notas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        )}
        {notas.map((n) => {
          const podeEditar = n.autor_id === autorId;
          return (
            <div key={n.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
              {editandoId === n.id ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={textoEditado}
                    onChange={(e) => setTextoEditado(e.target.value)}
                    className="bg-background"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => salvarEdicao(n.id)} className="uppercase tracking-widest">
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditandoId(null)}
                      className="uppercase tracking-widest"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground/90">{n.texto}</p>
                    {podeEditar && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => iniciarEdicao(n)}
                          aria-label="Editar registro"
                          className="text-muted-foreground/70 hover:text-gold"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          onClick={() => excluir(n.id)}
                          disabled={excluindoId === n.id}
                          aria-label="Excluir registro"
                          className="text-muted-foreground/70 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {n.imagem_url && (
                    <img
                      src={n.imagem_url}
                      alt=""
                      className="mt-2 h-32 w-32 rounded-lg object-cover"
                    />
                  )}
                </>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {n.profiles?.nome ?? "Equipe"} ·{" "}
                {new Date(n.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>

      {notasAvulsoAntigas && notasAvulsoAntigas.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            De quando ainda era atendido como avulso
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {notasAvulsoAntigas.map((n) => (
              <div key={n.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm text-foreground/80">{n.texto}</p>
                {n.imagem_url && (
                  <img src={n.imagem_url} alt="" className="mt-2 h-32 w-32 rounded-lg object-cover" />
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.profiles?.nome ?? "Equipe"} · {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
