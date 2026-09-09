import Link from "next/link";
import Image from "next/image";
import { UsersIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RazorDivider from "@/components/RazorDivider";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: servicos },
    { data: barbeiros },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("servicos").select("*").eq("ativo", true).order("preco"),
    supabase
      .from("barbeiros")
      .select("profile_id, bio, especialidades, profiles(nome, avatar_url), portfolio_itens(url, ordem)")
      .eq("ativo", true)
      .limit(3),
  ]);
  // Logado, a hero troca "Primeiro atendimento" (que não faz mais sentido pra
  // quem já é cliente) por "Agendar horário", e o 2º botão vira um atalho em
  // destaque pra "Meus agendamentos" em vez de repetir o link de login.
  const hrefPrimeiroBotao = user ? "/agendar" : "/cadastro";
  const textoPrimeiroBotao = user ? "Agendar horário" : "Primeiro atendimento";
  const hrefSegundoBotao = user ? "/painel/cliente" : "/login";
  const textoSegundoBotao = user ? "Meus agendamentos" : "Já sou cliente";

  return (
    <div>
      {/* HERO — logo, a frase de efeito e o botão de agendar, direto ao ponto */}
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=60"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/90 to-background" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <Image
            src="/logo-full.png"
            alt="Bruno Silva Barbearia"
            width={200}
            height={176}
            priority
            className="h-auto w-40 sm:w-48"
          />
          <h1 className="mt-10 font-display text-4xl leading-[1.05] tracking-wide text-foreground sm:text-6xl">
            Sua próxima cadeira{" "}
            <span className="text-gold-gradient">já está esperando</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Escolha o dia, o horário e deixe o resto com a gente.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={hrefPrimeiroBotao}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full px-10 uppercase tracking-wider"
              )}
            >
              {textoPrimeiroBotao}
            </Link>
            <Link
              href={hrefSegundoBotao}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "rounded-full px-10 uppercase tracking-wider"
              )}
            >
              {textoSegundoBotao}
            </Link>
          </div>
        </div>
      </section>

      {/* SERVIÇOS — logo em seguida, pra agendar ser o mais rápido possível */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
          Tabela de preços
        </p>
        <h2 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Nossos serviços
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {servicos?.map((s) => (
            <Link key={s.id} href={`/agendar?servico=${s.id}`} className="h-full">
              <Card className="group h-full gap-0 overflow-hidden rounded-2xl border-border bg-ink-soft py-0 transition-colors hover:border-gold">
                {s.imagem_url && (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={s.imagem_url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 280px, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="flex h-full flex-col px-4 py-4 sm:px-6 sm:py-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
                    {s.duracao_minutos} min
                  </p>
                  <p className="mt-2 font-display text-lg text-foreground sm:text-2xl">{s.nome}</p>
                  <p className="mt-auto pt-3 font-mono text-2xl font-medium text-gold-gradient sm:pt-4 sm:text-3xl">
                    R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* NOSSA PÁGINA — chamada forte pro feed de posts (ex-"comunidade") */}
      <section className="border-y border-gold/30 bg-gradient-to-r from-gold/5 via-ink-soft to-gold/5">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
          <UsersIcon className="size-7 text-gold" />
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            Bastidores, cortes e novidades
          </h2>
          <p className="max-w-md text-muted-foreground">
            Acompanhe o dia a dia da barbearia, curta e comente os posts dos barbeiros.
          </p>
          <Link
            href="/comunidade"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-3 rounded-full px-10 uppercase tracking-wider"
            )}
          >
            Nossa Página
          </Link>
        </div>
      </section>

      {/* BARBEIROS */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <RazorDivider className="mb-14" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Time</p>
        <h2 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Nossos barbeiros
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {barbeiros?.map((b: any) => (
            <Link
              key={b.profile_id}
              href={`/barbeiros/${b.profile_id}`}
              className="group overflow-hidden rounded-2xl border border-border bg-ink-soft transition-colors hover:border-gold"
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
      </section>
    </div>
  );
}
