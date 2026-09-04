"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangleIcon, ImageIcon, NotebookTextIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useConfirmacao } from "@/components/ConfirmacaoProvider";

type Nota = {
  id: string;
  texto: string;
  imagem_url: string | null;
  created_at: string;
  autor_id: string;
  profiles: { nome: string } | null;
};

// Ficha de cliente avulso (agendado na hora, sem cadastro): não tem CPF nem
// conta, então não dá pra usar `clientes`/`cliente_notas`. Guardamos as
// anotações e o contador de no-show por telefone, num registro mais simples
// (sem bloqueio de site nem pacotes, que exigem cadastro de verdade).
export default function FichaAvulso({
  telefone,
  notasIniciais,
  qtdNoShow,
  autorId,
}: {
  telefone: string;
  notasIniciais: Nota[];
  qtdNoShow: number;
  autorId: string;
}) {
  const [notas, setNotas] = useState(notasIniciais);
  const [texto, setTexto] = useState("");
  const [imagemNova, setImagemNova] = useState<File | null>(null);
  const [previewNova, setPreviewNova] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const inputImagemNova = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const confirmar = useConfirmacao();

  async function enviarImagem(arquivo: File) {
    const path = `avulso/${telefone}/${Date.now()}-${arquivo.name}`;
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
      .from("notas_avulso")
      .insert({ telefone, autor_id: autorId, texto: texto.trim(), imagem_url: imagemUrl })
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
      .from("notas_avulso")
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
    const { error } = await supabase.from("notas_avulso").delete().eq("id", notaId);
    setExcluindoId(null);
    if (error) {
      toast.error("Não foi possível excluir", { description: error.message });
      return;
    }
    setNotas((prev) => prev.filter((n) => n.id !== notaId));
    toast.success("Registro excluído.");
    router.refresh();
  }

  return (
    <Card className="mt-6 border-border bg-ink-soft p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <NotebookTextIcon className="size-4" />
        Ficha do cliente avulso
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Cliente sem cadastro — anotações e no-show ficam vinculados ao telefone ({telefone}).
      </p>

      {qtdNoShow > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>
            Já não compareceu {qtdNoShow} {qtdNoShow === 1 ? "vez" : "vezes"} antes (nos seus atendimentos).
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
                    <img src={n.imagem_url} alt="" className="mt-2 h-32 w-32 rounded-lg object-cover" />
                  )}
                </>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {n.profiles?.nome ?? "Equipe"} · {new Date(n.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
