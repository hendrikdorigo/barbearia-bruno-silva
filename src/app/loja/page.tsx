import Image from "next/image";
import { ShoppingBagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(produtos ?? [])
              .filter((p: any) => (p.categoria || "outros") === cat)
              .map((p: any) => (
                <Card
                  key={p.id}
                  className="flex-row items-center justify-between gap-3 border-border bg-ink-soft px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {p.imagem_url && (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border">
                        <Image src={p.imagem_url} alt="" fill sizes="56px" className="object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                    </div>
                  </div>
                  <p className="font-mono text-xl font-medium text-gold-gradient">
                    R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                  </p>
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
