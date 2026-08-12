import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("ativo", true)
    .order("preco");

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("profile_id, bio, especialidades, portfolio_imagens, profiles(nome, avatar_url)")
    .eq("ativo", true)
    .limit(3);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-line">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-36">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Barbearia · Estilo · Tradição
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] tracking-wide text-neutral-50 sm:text-8xl">
            BRUNO SILVA
            <br />
            <span className="text-gold-gradient">BARBEARIA</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-300">
            Cortes precisos, barba desenhada e um atendimento que respeita seu
            tempo. Agende em poucos cliques e escolha o barbeiro da sua
            confiança.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/barbeiros"
              className="rounded-full bg-gold-gradient px-8 py-3 text-sm font-bold uppercase tracking-wider text-ink transition-transform hover:scale-105"
            >
              Agendar horário
            </Link>
            <Link
              href="/comunidade"
              className="rounded-full border border-ink-line px-8 py-3 text-sm font-bold uppercase tracking-wider text-neutral-200 hover:border-gold hover:text-gold"
            >
              Ver comunidade
            </Link>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
          Tabela de preços
        </p>
        <h2 className="mt-2 font-display text-4xl tracking-wide text-neutral-50 sm:text-5xl">
          Nossos serviços
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicos?.map((s) => (
            <div
              key={s.id}
              className="group rounded-2xl border border-ink-line bg-ink-soft p-6 transition-colors hover:border-gold"
            >
              <p className="text-sm uppercase tracking-widest text-neutral-400">
                {s.duracao_minutos} min
              </p>
              <p className="mt-2 font-display text-2xl text-neutral-50">
                {s.nome}
              </p>
              <p className="mt-4 font-display text-4xl text-gold-gradient">
                R$ {Number(s.preco).toFixed(2).replace(".", ",")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BARBEIROS */}
      <section className="border-t border-ink-line bg-ink-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
            Time
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-neutral-50 sm:text-5xl">
            Nossos barbeiros
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {barbeiros?.map((b: any) => (
              <Link
                key={b.profile_id}
                href={`/barbeiros/${b.profile_id}`}
                className="group overflow-hidden rounded-2xl border border-ink-line bg-ink transition-colors hover:border-gold"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={
                      b.portfolio_imagens?.[0] ||
                      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800"
                    }
                    alt={b.profiles?.nome ?? "Barbeiro"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="font-display text-2xl text-neutral-50">
                    {b.profiles?.nome}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                    {b.bio}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/barbeiros"
              className="text-sm font-semibold uppercase tracking-widest text-gold hover:underline"
            >
              Ver todos os barbeiros →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
