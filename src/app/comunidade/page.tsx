import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export default async function ComunidadePage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts_comunidade")
    .select(
      "*, barbeiros(profile_id, profiles(nome, avatar_url)), post_curtidas(cliente_id), post_comentarios(id, comentario, created_at, clientes(profile_id, profiles(nome)))"
    )
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Comunidade
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Novidades da barbearia
      </h1>
      <p className="mt-3 text-neutral-400">
        Acompanhe cortes, bastidores e novidades postadas pelos barbeiros.
        Curta e comente se você for cliente cadastrado.
      </p>

      <div className="mt-10 space-y-6">
        {posts?.length ? (
          posts.map((p: any) => (
            <PostCard key={p.id} post={p} usuarioId={user?.id ?? null} />
          ))
        ) : (
          <p className="text-sm text-neutral-500">Nenhum post ainda.</p>
        )}
      </div>
    </div>
  );
}
