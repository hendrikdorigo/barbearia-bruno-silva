import { createClient } from "@/lib/supabase/server";

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
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Produtos da barbearia
      </h1>
      <p className="mt-3 text-neutral-400">
        Bebidas, pomadas e produtos de cuidado — adicione durante seu
        atendimento diretamente na sua comanda.
      </p>

      {categorias.map((cat) => (
        <div key={cat} className="mt-10">
          <h2 className="font-display text-2xl capitalize text-neutral-100">{cat}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(produtos ?? [])
              .filter((p: any) => (p.categoria || "outros") === cat)
              .map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-ink-line bg-ink-soft px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-neutral-100">{p.nome}</p>
                    {p.descricao && <p className="text-xs text-neutral-500">{p.descricao}</p>}
                  </div>
                  <p className="font-display text-xl text-gold-gradient">
                    R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}

      {(!produtos || produtos.length === 0) && (
        <p className="mt-8 text-sm text-neutral-500">Nenhum produto cadastrado ainda.</p>
      )}
    </div>
  );
}
