import Link from "next/link";
import Image from "next/image";
import { CalendarCheckIcon, MapPinIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RazorDivider from "@/components/RazorDivider";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "Escolha o dia e horário",
    description: "Agenda em tempo real, sem ligação e sem espera.",
    icon: CalendarCheckIcon,
  },
  {
    label: "Escolha o barbeiro",
    description: "Veja quem está disponível naquele horário e escolha seu profissional.",
    icon: SparklesIcon,
  },
  {
    label: "Apareça e aproveite",
    description: "Chegue, sente na cadeira — o resto é com a gente.",
    icon: ShieldCheckIcon,
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: servicos }, { data: barbeiros }] = await Promise.all([
    supabase.from("servicos").select("*").eq("ativo", true).order("preco"),
    supabase
      .from("barbeiros")
      .select("profile_id, bio, especialidades, profiles(nome, avatar_url), portfolio_itens(url, ordem)")
      .eq("ativo", true)
      .limit(3),
  ]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
        <div className="pointer-events-none absolute -right-24 -top-24 hidden opacity-[0.07] lg:block">
          <Image src="/logo-mark.png" alt="" width={560} height={520} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="font-serif text-sm italic tracking-wide text-gold">
            Barbearia · Estilo · Tradição
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] tracking-wide text-foreground sm:text-8xl">
            BRUNO SILVA
            <br />
            <span className="text-gold-gradient">BARBEARIA</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Cortes precisos, barba desenhada e um atendimento que respeita seu
            tempo. Agende em poucos cliques e escolha o barbeiro da sua
            confiança.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/agendar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full px-8 uppercase tracking-wider"
              )}
            >
              Agendar horário
            </Link>
            <Link
              href="/comunidade"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full px-8 uppercase tracking-wider"
              )}
            >
              Ver comunidade
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <a
              href="https://maps.app.goo.gl/MTAQ8eTVVPAgpziD6"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <MapPinIcon className="size-4 text-gold" />
              Rua 25 de Março, 351 — Limeira/SP
            </a>
            <span className="flex items-center gap-2">
              <CalendarCheckIcon className="size-4 text-gold" />
              Todos os dias, 09h–19h30
            </span>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex gap-4">
              <span className="font-display text-3xl text-gold/40">
                0{i + 1}
              </span>
              <div>
                <step.icon className="mb-2 size-5 text-gold" />
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <RazorDivider className="mb-14" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
          Tabela de preços
        </p>
        <h2 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Nossos serviços
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicos?.map((s) => (
            <Link key={s.id} href={`/agendar?servico=${s.id}`}>
              <Card className="group gap-0 rounded-2xl border-border bg-ink-soft py-6 transition-colors hover:border-gold">
                <CardContent className="px-6">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">
                    {s.duracao_minutos} min
                  </p>
                  <p className="mt-2 font-display text-2xl text-foreground">{s.nome}</p>
                  <p className="mt-4 font-mono text-3xl font-medium text-gold-gradient">
                    R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* BARBEIROS */}
      <section className="border-t border-border bg-ink-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Time</p>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            Nossos barbeiros
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {barbeiros?.map((b: any) => (
              <Link
                key={b.profile_id}
                href={`/barbeiros/${b.profile_id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-gold"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={
                      [...(b.portfolio_itens ?? [])].sort((x, y) => x.ordem - y.ordem)[0]?.url ||
                      b.profiles?.avatar_url ||
                      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800"
                    }
                    alt={b.profiles?.nome ?? "Barbeiro"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                </div>
                <div className="p-5">
                  <p className="font-display text-2xl text-foreground">{b.profiles?.nome}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.bio}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/barbeiros" className={cn(buttonVariants({ variant: "link" }), "text-gold")}>
              Ver todos os barbeiros →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <RazorDivider className="mx-auto mb-10 max-w-xs" />
        <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Sua próxima cadeira <span className="text-gold-gradient">já está esperando</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Escolha o dia, o horário e deixe o resto com a gente.
        </p>
        <Link
          href="/agendar"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 rounded-full px-10 uppercase tracking-wider"
          )}
        >
          Agendar agora
        </Link>
      </section>
    </div>
  );
}
