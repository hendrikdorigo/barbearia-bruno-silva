"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extrairMencoes } from "@/lib/mentions";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NovoPostForm({ barbeiroId }: { barbeiroId: string }) {
  const [tipo, setTipo] = useState<"texto" | "imagem" | "video">("texto");
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Gera (e libera) a URL de preview local sempre que o arquivo escolhido muda.
  useEffect(() => {
    if (!arquivo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  async function publicar() {
    setEnviando(true);
    setErro(null);

    let conteudoUrl: string | null = null;

    if (tipo !== "texto" && arquivo) {
      const path = `${barbeiroId}/${Date.now()}-${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("comunidade")
        .upload(path, arquivo, { upsert: true });
      if (uploadError) {
        setErro(uploadError.message);
        setEnviando(false);
        return;
      }
      conteudoUrl = supabase.storage.from("comunidade").getPublicUrl(path).data.publicUrl;
    }

    const mencoes = texto ? await extrairMencoes(supabase, texto) : [];

    const { error } = await supabase.from("posts_comunidade").insert({
      barbeiro_id: barbeiroId,
      tipo,
      texto: texto || null,
      conteudo_url: conteudoUrl,
      mencoes,
    });

    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setTexto("");
    setArquivo(null);
    router.refresh();
  }

  return (
    <Card className="mt-6 border-border bg-ink-soft p-5">
      <div className="flex gap-2">
        {(["texto", "imagem", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTipo(t);
              setArquivo(null);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-colors",
              tipo === t ? "bg-gold-gradient text-ink" : "border border-border text-muted-foreground hover:border-gold"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva algo para os clientes... (use @Nome para mencionar alguém)"
        rows={3}
        className="mt-3 bg-background"
      />

      {tipo !== "texto" && !arquivo && (
        <Input
          type="file"
          accept={tipo === "imagem" ? "image/*" : "video/*"}
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="mt-3"
        />
      )}

      {tipo !== "texto" && arquivo && previewUrl && (
        <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setArquivo(null)}
            aria-label="Remover mídia"
            className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-ink/80 text-foreground hover:bg-destructive"
          >
            <XIcon className="size-4" />
          </button>
          {tipo === "imagem" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Pré-visualização" className="max-h-80 w-full object-cover" />
          ) : (
            <video src={previewUrl} controls className="max-h-80 w-full" />
          )}
        </div>
      )}

      {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}

      <Button onClick={publicar} disabled={enviando} size="sm" className="mt-3 uppercase tracking-widest">
        {enviando ? "Publicando..." : "Publicar"}
      </Button>
    </Card>
  );
}
