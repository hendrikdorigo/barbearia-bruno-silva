import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "@/components/FeedbackForm";
import PostCard from "@/components/PostCard";

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
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex flex-wrap items-end gap-4 sm:items-center">
          <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-ink bg-ink-soft sm:h-28 sm:w-28">
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
              <span className="rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
                Fundador da barbearia
              </span>
            )}
            <h1 className="mt-1 font-display text-4xl tracking-wide text-neutral-50">
              {barbeiro.profiles?.nome}
            </h1>
            {media && (
              <p className="mt-1 text-sm text-gold">
                ★ {media} · {feedbacks?.length} avaliações
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/agendar/${barbeiro.profile_id}`}
              className="inline-block rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-ink transition-transform hover:scale-105"
            >
              Agendar
            </Link>
            {isDono && (
              <Link
                href="/painel/barbeiro/portfolio"
                className="inline-block rounded-full border border-gold px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-gold hover:bg-gold/10"
              >
                Editar perfil
              </Link>
            )}
          </div>
        </div>

        <p className="mt-4 max-w-xl text-neutral-300">{barbeiro.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {barbeiro.especialidades?.map((e: string) => (
            <span
              key={e}
              className="rounded-full border border-ink-line px-3 py-1 text-xs text-neutral-300"
            >
              {e}
            </span>
          ))}
        </div>

        {barbeiro.portfolio_imagens && barbeiro.portfolio_imagens.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl tracking-wide text-neutral-50">
              Portfólio
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {barbeiro.portfolio_imagens.map((img: string, i: number) => (
                <div
                  key={i}
                  className="relative h-32 overflow-hidden rounded-xl border border-ink-line"
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Posts do perfil = posts da comunidade filtrados por esse barbeiro ===== */}
        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-neutral-50">
            Posts de {barbeiro.profiles?.nome?.split(" ")[0]}
          </h2>
          <div className="mt-4 space-y-6">
            {posts?.length ? (
              posts.map((p: any) => (
                <PostCard key={p.id} post={p} usuarioId={user?.id ?? null} />
              ))
            ) : (
              <p className="text-sm text-neutral-500">Nenhum post ainda.</p>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl tracking-wide text-neutral-50">
            Avaliações
          </h2>

          {isCliente && <FeedbackForm barbeiroId={barbeiro.profile_id} />}

          <div className="mt-6 space-y-4">
            {feedbacks?.length ? (
              feedbacks.map((f: any) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-ink-line bg-ink-soft p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-neutral-100">
                      {f.clientes?.profiles?.nome ?? "Cliente"}
                    </p>
                    <p className="text-gold">{"★".repeat(f.nota)}</p>
                  </div>
                  {f.comentario_preset && (
                    <span className="mt-1 inline-block rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      {f.comentario_preset}
                    </span>
                  )}
                  {f.comentario && (
                    <p className="mt-2 text-sm text-neutral-400">{f.comentario}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">
                Ainda não há avaliações para este barbeiro.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
