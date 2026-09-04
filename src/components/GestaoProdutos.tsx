"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import ImageCropper from "@/components/ImageCropper";
import { cn } from "@/lib/utils";

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  estoque: number | null;
  ativo: boolean;
  imagem_url: string | null;
};

export default function GestaoProdutos({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("bebidas");
  const [imagem, setImagem] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trocandoImagemId, setTrocandoImagemId] = useState<string | null>(null);
  const inputsImagemExistente = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewImagemNova, setPreviewImagemNova] = useState<string | null>(null);
  const [recorteNovo, setRecorteNovo] = useState<File | null>(null);
  const [recorteExistente, setRecorteExistente] = useState<{ produtoId: string; file: File } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function enviarImagem(arquivo: File, produtoId: string) {
    const path = `${produtoId}/${Date.now()}-${arquivo.name}`;
    const { error } = await supabase.storage.from("produtos").upload(path, arquivo, { upsert: true });
    if (error) return null;
    return supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
  }

  async function adicionar() {
    setErro(null);
    if (!nome || !preco) {
      setErro("Preencha nome e preço.");
      return;
    }
    setSalvando(true);
    const { data: salvo, error } = await supabase
      .from("produtos")
      .insert({ nome, descricao: descricao || null, preco: Number(preco), categoria })
      .select()
      .single();
    if (error || !salvo) {
      setSalvando(false);
      setErro(error?.message ?? "Não foi possível salvar.");
      return;
    }

    let produtoSalvo = salvo as Produto;
    if (imagem) {
      const url = await enviarImagem(imagem, produtoSalvo.id);
      if (url) {
        await supabase.from("produtos").update({ imagem_url: url }).eq("id", produtoSalvo.id);
        produtoSalvo = { ...produtoSalvo, imagem_url: url };
      }
    }

    setSalvando(false);
    setProdutos((prev) => [...prev, produtoSalvo]);
    setNome("");
    setDescricao("");
    setPreco("");
    setImagem(null);
    setPreviewImagemNova(null);
    router.refresh();
  }

  async function trocarImagemExistente(produtoId: string, arquivo: File) {
    setTrocandoImagemId(produtoId);
    const url = await enviarImagem(arquivo, produtoId);
    if (url) {
      await supabase.from("produtos").update({ imagem_url: url }).eq("id", produtoId);
      setProdutos((prev) => prev.map((p) => (p.id === produtoId ? { ...p, imagem_url: url } : p)));
      router.refresh();
    }
    setTrocandoImagemId(null);
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("produtos").update({ ativo: !ativo }).eq("id", id);
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !ativo } : p)));
    router.refresh();
  }

  return (
    <div className="mt-4">
      <Card className="border-border bg-ink-soft p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do produto" className="bg-background" />
          <Input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria (ex: bebidas)"
            className="bg-background"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço"
            className="bg-background"
          />
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="bg-background"
          />
        </div>
        <label className="mt-3 block text-xs uppercase tracking-widest text-muted-foreground">
          Foto do produto (opcional)
        </label>
        <div className="mt-1.5 flex items-center gap-3">
          {previewImagemNova && (
            <img
              src={previewImagemNova}
              alt=""
              className="size-14 shrink-0 rounded-lg border border-border object-cover"
            />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) setRecorteNovo(arquivo);
              e.target.value = "";
            }}
            className="bg-background"
          />
        </div>
        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
        <Button onClick={adicionar} disabled={salvando} size="sm" className="mt-4 w-fit uppercase tracking-widest">
          {salvando ? "Salvando..." : "Adicionar produto"}
        </Button>
      </Card>

      <div className="mt-5 space-y-2">
        {produtos.map((p) => (
          <Card
            key={p.id}
            className={cn(
              "flex-row flex-wrap items-center justify-between gap-3 border-border bg-ink-soft px-4 py-3",
              !p.ativo && "border-border/40 bg-ink-soft/40"
            )}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputsImagemExistente.current[p.id]?.click()}
                disabled={trocandoImagemId === p.id}
                aria-label="Trocar foto do produto"
                className="group relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background"
              >
                {p.imagem_url ? (
                  <img src={p.imagem_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-transparent transition-colors group-hover:bg-ink/60 group-hover:text-white">
                  <ImageIcon className="size-4" />
                </span>
                <input
                  ref={(el) => {
                    inputsImagemExistente.current[p.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) setRecorteExistente({ produtoId: p.id, file: arquivo });
                    e.target.value = "";
                  }}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {p.nome} · <span className="font-mono">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</span>
                </p>
                <p className="text-xs text-muted-foreground">{p.categoria}</p>
              </div>
            </div>
            <button
              onClick={() => alternarAtivo(p.id, p.ativo)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full",
                p.ativo
                  ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                  : "border-success/40 text-success hover:bg-success/10"
              )}
            >
              {p.ativo ? "Desativar" : "Ativar"}
            </button>
          </Card>
        ))}
      </div>

      {recorteNovo && (
        <ImageCropper
          file={recorteNovo}
          aspecto={4 / 3}
          onCancel={() => setRecorteNovo(null)}
          onCrop={(arquivo) => {
            setImagem(arquivo);
            setPreviewImagemNova((anterior) => {
              if (anterior) URL.revokeObjectURL(anterior);
              return URL.createObjectURL(arquivo);
            });
            setRecorteNovo(null);
          }}
        />
      )}

      {recorteExistente && (
        <ImageCropper
          file={recorteExistente.file}
          aspecto={4 / 3}
          salvando={trocandoImagemId === recorteExistente.produtoId}
          onCancel={() => setRecorteExistente(null)}
          onCrop={async (arquivo) => {
            await trocarImagemExistente(recorteExistente.produtoId, arquivo);
            setRecorteExistente(null);
          }}
        />
      )}
    </div>
  );
}
