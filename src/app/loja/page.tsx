import Image from "next/image";
import { ShoppingBagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

export default async function LojaPage() {
  const supabase = await createClient();
  const { data: produtos } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("categoria");

  const categorias = Array.from(new Set((produtos ?? []).map((p: any) => p.categoria || "outros")));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Loja</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground">
        Produtos da barbearia
      </h1>
      <p className="mt-3 text-muted-foreground">
        Bebidas, pomadas e produtos de cuidado — adicione durante seu
        atendimento diretamente na sua comanda.
      </p>

      {categorias.map((cat) => (
        <div key={cat} className="mt-10">
          <h2 className="font-display text-2xl capitalize text-foreground">{cat}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(produtos ?? [])
              .filter((p: any) => (p.categoria || "outros") === cat)
              .map((p: any) => (
                <Card
                  key={p.id}
                  className="gap-0 overflow-hidden rounded-2xl border-border bg-ink-soft py-0"
                >
                  <div className="relative aspect-[4/3] w-full bg-background">
                    {p.imagem_url ? (
                      <Image
                        src={p.imagem_url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBagIcon className="size-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-col gap-1 px-5 py-4">
                    <p className="font-display text-xl text-foreground">{p.nome}</p>
                    {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
                    <p className="mt-2 font-mono text-2xl font-medium text-gold-gradient">
                      R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {(!produtos || produtos.length === 0) && (
        <Empty className="mt-10 border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBagIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
            <EmptyDescription>
              Em breve a loja da barbearia estará disponível aqui.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
