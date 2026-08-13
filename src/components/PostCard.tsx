"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extrairMencoes } from "@/lib/mentions";

export default function PostCard({ post, usuarioId }: { post: any; usuarioId: string | null }) {
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const curtidas: any[] = post.post_curtidas ?? [];
  const comentarios: any[] = post.post_comentarios ?? [];
  const jaCurtiu = usuarioId ? curtidas.some((c) => c.cliente_id === usuarioId) : false;

  async function curtir() {
    if (!usuarioId) return router.push("/login");
    if (jaCurtiu) {
      await supabase
        .from("post_curtidas")
        .delete()
        .eq("post_id", post.id)
        .eq("cliente_id", usuarioId);
    } else {
      await supabase.from("post_curtidas").insert({ post_id: post.id, cliente_id: usuarioId });
    }
    router.refresh();
  }

  async function comentar() {
    if (!usuarioId) return router.push("/login");
    if (!comentario.trim()) return;
    setEnviando(true);
    const mencoes = await extrairMencoes(supabase, comentario);
    await supabase.from("post_comentarios").insert({
      post_id: post.id,
      cliente_id: usuarioId,
      comentario,
      mencoes,
    });
    setComentario("");
    setEnviando(false);
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-line bg-ink-soft">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient font-display text-ink">
          {post.barbeiros?.profiles?.nome?.[0] ?? "B"}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-100">
            {post.barbeiros?.profiles?.nome}
          </p>
          <p className="text-xs text-neutral-500">
            {new Date(post.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {post.texto && <p className="px-5 pb-3 text-neutral-200">{post.texto}</p>}

      {post.tipo === "imagem" && post.conteudo_url && (
        <div className="relative h-80 w-full">
          <Image src={post.conteudo_url} alt="" fill className="object-cover" />
        </div>
      )}
      {post.tipo === "video" && post.conteudo_url && (
        <video src={post.conteudo_url} controls className="max-h-96 w-full" />
      )}

      <div className="flex items-center gap-4 px-5 py-3 text-sm text-neutral-400">
        <button
          onClick={curtir}
          className={jaCurtiu ? "text-gold" : "hover:text-gold"}
        >
          {jaCurtiu ? "★" : "☆"} {curtidas.length} curtida{curtidas.length === 1 ? "" : "s"}
        </button>
        <span>💬 {comentarios.length} comentário{comentarios.length === 1 ? "" : "s"}</span>
      </div>

      {comentarios.length > 0 && (
        <div className="space-y-2 border-t border-ink-line px-5 py-3">
          {comentarios.map((c) => (
            <p key={c.id} className="text-sm text-neutral-400">
              <span className="font-semibold text-neutral-200">
                {c.clientes?.profiles?.nome ?? "Cliente"}:
              </span>{" "}
              {c.comentario}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-ink-line px-5 py-3">
        <input
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder={usuarioId ? "Escreva um comentário..." : "Entre para comentar"}
          disabled={!usuarioId}
          className="flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        <button
          onClick={comentar}
          disabled={enviando || !usuarioId}
          className="rounded-lg bg-gold-gradient px-4 py-2 text-xs font-bold uppercase text-ink disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </article>
  );
}
