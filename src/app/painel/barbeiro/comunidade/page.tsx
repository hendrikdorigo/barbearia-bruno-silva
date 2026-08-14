import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoPostForm from "@/components/NovoPostForm";

export default async function ComunidadeBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("posts_comunidade")
    .select("*, post_curtidas(cliente_id), post_comentarios(id)")
    .eq("barbeiro_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meus posts
      </h1>
      <p className="mt-2 text-muted-foreground">
        Compartilhe fotos, vídeos ou textos com os clientes cadastrados. Eles
        recebem uma notificação a cada novo post.
      </p>

      <NovoPostForm barbeiroId={user.id} />

      <div className="mt-10 space-y-3">
        {posts?.length ? (
          posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-ink-soft p-4">
              <p className="text-xs uppercase tracking-widest text-gold">{p.tipo}</p>
              {p.texto && <p className="mt-1 text-foreground/90">{p.texto}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {(p.post_curtidas as any[])?.length ?? 0} curtidas ·{" "}
                {(p.post_comentarios as any[])?.length ?? 0} comentários
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Você ainda não postou nada.</p>
        )}
      </div>
    </div>
  );
}
