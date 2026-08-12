import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function BarbeirosPage() {
  const supabase = await createClient();
  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select(
      "profile_id, bio, especialidades, portfolio_imagens, is_dono, profiles(nome, avatar_url)"
    )
    .eq("ativo", true);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Time
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Nossos barbeiros
      </h1>
      <p className="mt-3 max-w-xl text-neutral-400">
        Escolha um profissional para ver o portfólio completo, avaliações de
        clientes e agendar seu horário.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {barbeiros?.map((b: any) => (
          <Link
            key={b.profile_id}
            href={`/barbeiros/${b.profile_id}`}
            className="group overflow-hidden rounded-2xl border border-ink-line bg-ink-soft transition-colors hover:border-gold"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={
                  b.portfolio_imagens?.[0] ||
                  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800"
                }
                alt={b.profiles?.nome ?? "Barbeiro"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {b.is_dono && (
                <span className="absolute left-3 top-3 rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
                  Fundador
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="font-display text-2xl text-neutral-50">
                {b.profiles?.nome}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                {b.bio}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {b.especialidades?.slice(0, 3).map((e: string) => (
                  <span
                    key={e}
                    className="rounded-full border border-ink-line px-2.5 py-1 text-xs text-neutral-400"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
