import { createClient } from "@/lib/supabase/server";

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
      <h1 className="mt-2 font-display text-5xl tracking-wide text-neutral-50">
        Serviços
      </h1>
      <div className="mt-10 divide-y divide-ink-line rounded-2xl border border-ink-line bg-ink-soft">
        {servicos?.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="font-display text-xl text-neutral-50">{s.nome}</p>
              <p className="text-sm text-neutral-400">{s.duracao_minutos} minutos</p>
            </div>
            <p className="font-display text-2xl text-gold-gradient">
              R$ {Number(s.preco).toFixed(2).replace(".", ",")}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-neutral-500">
        Formas de pagamento aceitas: Crédito, Débito, Dinheiro e Pix. Você pode
        optar por pagamento antecipado ao agendar.
      </p>
    </div>
  );
}
