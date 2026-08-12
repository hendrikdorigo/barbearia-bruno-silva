import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "@/components/FeedbackForm";

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="grid gap-10 sm:grid-cols-[280px_1fr]">
        <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-ink-line sm:h-full">
          <Image
            src={
              barbeiro.portfolio_imagens?.[0] ||
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800"
            }
            alt={barbeiro.profiles?.nome ?? ""}
            fill
            className="object-cover"
          />
        </div>
        <div>
          {barbeiro.is_dono && (
            <span className="rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
              Fundador da barbearia
            </span>
          )}
          <h1 className="mt-3 font-display text-5xl tracking-wide text-neutral-50">
            {barbeiro.profiles?.nome}
          </h1>
          {media && (
            <p className="mt-2 text-sm text-gold">
              ★ {media} · {feedbacks?.length} avaliações
            </p>
          )}
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
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/agendar/${barbeiro.profile_id}`}
              className="inline-block rounded-full bg-gold-gradient px-8 py-3 text-sm font-bold uppercase tracking-wider text-ink transition-transform hover:scale-105"
            >
              Agendar com {barbeiro.profiles?.nome?.split(" ")[0]}
            </Link>
            {user?.id === barbeiro.profile_id && (
              <Link
                href="/painel/barbeiro/portfolio"
                className="inline-block rounded-full border border-gold px-8 py-3 text-sm font-bold uppercase tracking-wider text-gold hover:bg-gold/10"
              >
                Editar meu portfólio
              </Link>
            )}
          </div>
        </div>
      </div>

      {barbeiro.portfolio_imagens && barbeiro.portfolio_imagens.length > 1 && (
        <div className="mt-16">
          <h2 className="font-display text-3xl tracking-wide text-neutral-50">
            Portfólio
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {barbeiro.portfolio_imagens.slice(1).map((img: string, i: number) => (
              <div
                key={i}
                className="relative h-48 overflow-hidden rounded-xl border border-ink-line"
              >
                <Image src={img} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16">
        <h2 className="font-display text-3xl tracking-wide text-neutral-50">
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
  );
}
