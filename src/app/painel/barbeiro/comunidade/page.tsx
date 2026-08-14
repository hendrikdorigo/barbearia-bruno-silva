import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoPostForm from "@/components/NovoPostForm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { MessagesSquareIcon } from "lucide-react";

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
    <div className="mx-auto max-w-2xl">
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
            <Card key={p.id} className="gap-0 border-border bg-ink-soft p-4">
              <Badge variant="outline" className="w-fit uppercase tracking-widest text-gold">
                {p.tipo}
              </Badge>
              {p.texto && <p className="mt-2 text-foreground/90">{p.texto}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {(p.post_curtidas as any[])?.length ?? 0} curtidas ·{" "}
                {(p.post_comentarios as any[])?.length ?? 0} comentários
              </p>
            </Card>
          ))
        ) : (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessagesSquareIcon />
              </EmptyMedia>
              <EmptyTitle>Você ainda não postou nada</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
