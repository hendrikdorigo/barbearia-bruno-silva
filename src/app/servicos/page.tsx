import Link from "next/link";
import Image from "next/image";
import { ClockIcon, ScissorsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("ativo", true)
    .order("preco");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">
        Tabela de preços
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">Serviços</h1>

      <Card className="mt-10 divide-y divide-border rounded-2xl border-border bg-ink-soft py-0">
        {servicos?.map((s) => (
          <Link
            key={s.id}
            href={`/agendar?servico=${s.id}`}
            className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-gold/5"
          >
            <div className="flex items-center gap-4">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                {s.imagem_url ? (
                  <Image src={s.imagem_url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <ScissorsIcon className="size-5 text-muted-foreground" />
                )}
              </span>
              <div>
                <p className="font-display text-xl text-foreground">{s.nome}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {s.duracao_minutos} minutos
                </p>
              </div>
            </div>
            <p className="font-mono text-2xl font-medium text-gold-gradient">
              R$ {Number(s.preco).toFixed(2).replace(".", ",")}
            </p>
          </Link>
        ))}
      </Card>
      <p className="mt-6 text-sm text-muted-foreground">
        Toque em um serviço para escolher o barbeiro e agendar.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Formas de pagamento aceitas: Crédito, Débito, Dinheiro e Pix.
      </p>
    </div>
  );
}
