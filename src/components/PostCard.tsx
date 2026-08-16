"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extrairMencoes } from "@/lib/mentions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ExcluirPostBotao from "@/components/ExcluirPostBotao";
import type { PerfilCliente } from "@/lib/nomes-clientes";
import { cn } from "@/lib/utils";

export default function PostCard({
  post,
  usuarioId,
  nomesClientes = {},
}: {
  post: any;
  usuarioId: string | null;
  nomesClientes?: Record<string, PerfilCliente>;
}) {
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Estado local para curtir refletir na hora - esperar o router.refresh()
  // (recarrega a pagina inteira do servidor) deixava o botao parecendo
  // travado até a resposta do banco voltar.
  const [curtidas, setCurtidas] = useState<any[]>(post.post_curtidas ?? []);
  const router = useRouter();
  const supabase = createClient();

  const comentarios: any[] = post.post_comentarios ?? [];
  const jaCurtiu = usuarioId ? curtidas.some((c) => c.cliente_id === usuarioId) : false;
  const ehDono = usuarioId !== null && usuarioId === post.barbeiro_id;

  async function curtir() {
    if (!usuarioId) return router.push("/login");

    if (jaCurtiu) {
      setCurtidas((prev) => prev.filter((c) => c.cliente_id !== usuarioId));
      const { error } = await supabase
        .from("post_curtidas")
        .delete()
        .eq("post_id", post.id)
        .eq("cliente_id", usuarioId);
      if (error) setCurtidas((prev) => [...prev, { cliente_id: usuarioId }]);
    } else {
      setCurtidas((prev) => [...prev, { cliente_id: usuarioId }]);
      const { error } = await supabase.from("post_curtidas").insert({ post_id: post.id, cliente_id: usuarioId });
      if (error) setCurtidas((prev) => prev.filter((c) => c.cliente_id !== usuarioId));
    }
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
    <article className="overflow-hidden rounded-2xl border border-border bg-ink-soft">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {post.barbeiros?.profiles?.avatar_url && (
              <AvatarImage src={post.barbeiros.profiles.avatar_url} alt="" />
            )}
            <AvatarFallback className="bg-gold-gradient font-display text-ink">
              {post.barbeiros?.profiles?.nome?.[0] ?? "B"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {post.barbeiros?.profiles?.nome}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
        {ehDono && <ExcluirPostBotao postId={post.id} />}
      </div>

      {post.texto && <p className="px-5 pb-3 text-foreground/90">{post.texto}</p>}

      {post.tipo === "imagem" && post.conteudo_url && (
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
          <Image src={post.conteudo_url} alt="" fill className="object-cover" />
        </div>
      )}
      {post.tipo === "video" && post.conteudo_url && (
        <video src={post.conteudo_url} controls className="max-h-96 w-full" />
      )}

      <div className="flex items-center gap-4 px-5 py-3 text-sm text-muted-foreground">
        <button
          onClick={curtir}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            jaCurtiu ? "text-gold" : "hover:text-gold"
          )}
        >
          <HeartIcon className={cn("size-4", jaCurtiu && "fill-gold")} />
          {curtidas.length} curtida{curtidas.length === 1 ? "" : "s"}
        </button>
        <span className="flex items-center gap-1.5">
          <MessageCircleIcon className="size-4" />
          {comentarios.length} comentário{comentarios.length === 1 ? "" : "s"}
        </span>
      </div>

      {comentarios.length > 0 && (
        <div className="space-y-2.5 border-t border-border px-5 py-3">
          {comentarios.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar size="sm" className="mt-0.5 shrink-0">
                {nomesClientes[c.cliente_id]?.avatar_url && (
                  <AvatarImage src={nomesClientes[c.cliente_id].avatar_url!} alt="" />
                )}
                <AvatarFallback className="text-[10px]">
                  {(nomesClientes[c.cliente_id]?.nome ?? "C").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground/90">
                  {nomesClientes[c.cliente_id]?.nome ?? "Cliente"}:
                </span>{" "}
                {c.comentario}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-border px-5 py-3">
        <Input
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder={usuarioId ? "Escreva um comentário..." : "Entre para comentar"}
          disabled={!usuarioId}
          className="flex-1"
        />
        <Button
          onClick={comentar}
          disabled={enviando || !usuarioId}
          size="sm"
          className="uppercase tracking-wide"
        >
          Enviar
        </Button>
      </div>
    </article>
  );
}
