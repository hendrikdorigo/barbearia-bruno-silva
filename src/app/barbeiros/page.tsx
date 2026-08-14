import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function BarbeirosPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const { servico } = await searchParams;
  const supabase = await createClient();
  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select(
      "profile_id, bio, especialidades, is_dono, profiles(nome, avatar_url), portfolio_itens(url, ordem)"
    )
    .eq("ativo", true);

  let servicoNome: string | null = null;
  if (servico) {
    const { data: s } = await supabase
      .from("servicos")
      .select("nome")
      .eq("id", servico)
      .maybeSingle();
    servicoNome = s?.nome ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Time
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        Nossos barbeiros
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        {servicoNome
          ? `Escolha o barbeiro para agendar "${servicoNome}".`
          : "Escolha um profissional para ver o portfólio completo, avaliações de clientes e agendar seu horário."}
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {barbeiros?.map((b: any) => (
          <Link
            key={b.profile_id}
            href={servico ? `/barbeiros/${b.profile_id}?servico=${servico}` : `/barbeiros/${b.profile_id}`}
            className="group overflow-hidden rounded-2xl border border-border bg-ink-soft transition-colors hover:border-gold"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={
                  [...(b.portfolio_itens ?? [])].sort((x, y) => x.ordem - y.ordem)[0]?.url ||
                  b.profiles?.avatar_url ||
                  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800"
                }
                alt={b.profiles?.nome ?? "Barbeiro"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {b.is_dono && (
                <Badge className="absolute left-3 top-3 border-transparent bg-gold-gradient text-[10px] font-bold uppercase tracking-widest text-ink">
                  Fundador
                </Badge>
              )}
            </div>
            <div className="p-5">
              <p className="font-display text-2xl text-foreground">
                {b.profiles?.nome}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {b.bio}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {b.especialidades?.slice(0, 3).map((e: string) => (
                  <Badge key={e} variant="outline" className="text-muted-foreground">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
