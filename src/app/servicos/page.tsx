import Link from "next/link";
import Image from "next/image";
import { ClockIcon, ScissorsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("ativo", true)
    .order("preco");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Tabela de preços
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">Serviços</h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {servicos?.map((s) => (
          <Link key={s.id} href={`/agendar?servico=${s.id}`} className="h-full">
            <Card className="group h-full gap-0 overflow-hidden rounded-2xl border-border bg-ink-soft py-0 transition-colors hover:border-gold">
              <div className="relative aspect-[4/3] w-full bg-background">
                {s.imagem_url ? (
                  <Image
                    src={s.imagem_url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ScissorsIcon className="size-10 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/0 to-ink/0" />
              </div>
              <CardContent className="flex h-full flex-col px-6 py-6">
                <p className="flex items-center gap-1.5 text-sm uppercase tracking-widest text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {s.duracao_minutos} min
                </p>
                <p className="mt-2 font-display text-2xl text-foreground">{s.nome}</p>
                <p className="mt-auto pt-4 font-mono text-3xl font-medium text-gold-gradient">
                  R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Toque em um serviço para escolher o barbeiro e agendar.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Formas de pagamento aceitas: Crédito, Débito, Dinheiro e Pix.
      </p>
    </div>
  );
}
