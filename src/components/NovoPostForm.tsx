"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NovoPostForm({ barbeiroId }: { barbeiroId: string }) {
  const [tipo, setTipo] = useState<"texto" | "imagem" | "video">("texto");
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

    const { error } = await supabase.from("posts_comunidade").insert({
      barbeiro_id: barbeiroId,
      tipo,
      texto: texto || null,
      conteudo_url: conteudoUrl,
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
    <div className="mt-6 rounded-xl border border-ink-line bg-ink-soft p-5">
      <div className="flex gap-2">
        {(["texto", "imagem", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${
              tipo === t ? "bg-gold-gradient text-ink" : "border border-ink-line text-neutral-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva algo para os clientes..."
        rows={3}
        className="mt-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 focus:border-gold focus:outline-none"
      />

      {tipo !== "texto" && (
        <input
          type="file"
          accept={tipo === "imagem" ? "image/*" : "video/*"}
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="mt-3 text-sm text-neutral-400"
        />
      )}

      {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}

      <button
        onClick={publicar}
        disabled={enviando}
        className="mt-3 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink disabled:opacity-50"
      >
        {enviando ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}
