import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StarIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "@/components/FeedbackForm";
import PostCard from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function BarbeiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("*, profiles(nome, avatar_url)")
    .eq("profile_id", id)
    .single();

  if (!barbeiro) notFound();

  const { data: feedbacks } = await supabase
    .from("feedbacks")
    .select("*, clientes(profile_id, profiles(nome))")
    .eq("barbeiro_id", id)
    .order("created_at", { ascending: false });

  const { data: posts } = await supabase
    .from("posts_comunidade")
    .select(
      "*, barbeiros(profile_id, profiles(nome, avatar_url)), post_curtidas(cliente_id), post_comentarios(id, comentario, created_at, clientes(profile_id, profiles(nome)))"
    )
    .eq("barbeiro_id", id)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isCliente = false;
  if (user) {
    const { data: cli } = await supabase
      .from("clientes")
      .select("profile_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    isCliente = Boolean(cli);
  }

  const media =
    feedbacks && feedbacks.length > 0
      ? (
          feedbacks.reduce((acc, f) => acc + f.nota, 0) / feedbacks.length
        ).toFixed(1)
      : null;

  const isDono = user?.id === barbeiro.profile_id;

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* ===== Capa estilo Facebook ===== */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64 sm:rounded-b-2xl">
        <Image
          src={
            barbeiro.banner_url ||
            barbeiro.portfolio_imagens?.[0] ||
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200"
          }
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex flex-wrap items-end gap-4 sm:items-center">
          <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-ink-soft sm:h-28 sm:w-28">
            <Image
              src={
                barbeiro.profiles?.avatar_url ||
                barbeiro.portfolio_imagens?.[0] ||
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300"
              }
              alt={barbeiro.profiles?.nome ?? ""}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            {barbeiro.is_dono && (
              <Badge className="border-transparent bg-gold-gradient text-[10px] font-bold uppercase tracking-widest text-ink">
                Fundador da barbearia
              </Badge>
            )}
            <h1 className="mt-1 font-display text-4xl tracking-wide text-foreground">
              {barbeiro.profiles?.nome}
            </h1>
            {media && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gold">
                <StarIcon className="size-3.5 fill-gold" />
                {media} · {feedbacks?.length} avaliações
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/agendar/${barbeiro.profile_id}`}
              className={cn(
                buttonVariants(),
                "rounded-full px-6 uppercase tracking-wider"
              )}
            >
              Agendar
            </Link>
            {isDono && (
              <Link
                href="/painel/barbeiro/portfolio"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-gold px-6 uppercase tracking-wider text-gold hover:bg-gold/10"
                )}
              >
                Editar perfil
              </Link>
            )}
          </div>
        </div>

        <p className="mt-4 max-w-xl text-muted-foreground">{barbeiro.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {barbeiro.especialidades?.map((e: string) => (
            <Badge key={e} variant="outline" className="text-muted-foreground">
              {e}
            </Badge>
          ))}
        </div>

        {barbeiro.portfolio_imagens && barbeiro.portfolio_imagens.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              Portfólio
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {barbeiro.portfolio_imagens.map((img: string, i: number) => (
                <div
                  key={i}
                  className="relative h-32 overflow-hidden rounded-xl border border-border"
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Posts do perfil = posts da comunidade filtrados por esse barbeiro ===== */}
        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            Posts de {barbeiro.profiles?.nome?.split(" ")[0]}
          </h2>
          <div className="mt-4 space-y-6">
            {posts?.length ? (
              posts.map((p: any) => (
                <PostCard key={p.id} post={p} usuarioId={user?.id ?? null} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            Avaliações
          </h2>

          {isCliente && <FeedbackForm barbeiroId={barbeiro.profile_id} />}

          <div className="mt-6 space-y-4">
            {feedbacks?.length ? (
              feedbacks.map((f: any) => (
                <Card key={f.id} className="border-border bg-ink-soft p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {f.clientes?.profiles?.nome ?? "Cliente"}
                    </p>
                    <div className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: f.nota }).map((_, i) => (
                        <StarIcon key={i} className="size-3.5 fill-gold" />
                      ))}
                    </div>
                  </div>
                  {f.comentario_preset && (
                    <Badge variant="secondary" className="mt-1 w-fit bg-gold/10 text-gold">
                      {f.comentario_preset}
                    </Badge>
                  )}
                  {f.comentario && (
                    <p className="mt-2 text-sm text-muted-foreground">{f.comentario}</p>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não há avaliações para este barbeiro.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
