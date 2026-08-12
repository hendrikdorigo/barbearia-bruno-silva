import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RepassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, barbeiros(profile_id, is_dono, profiles(nome))")
    .gt("valor_repasse_bruno", 0)
    .in("status", ["confirmado", "concluido"])
    .order("data_hora", { ascending: false });

  const porBarbeiro = new Map<string, { nome: string; total: number; qtd: number }>();
  for (const a of agendamentos ?? []) {
    const nome = (a as any).barbeiros?.profiles?.nome ?? "—";
    const atual = porBarbeiro.get(a.barbeiro_id) ?? { nome, total: 0, qtd: 0 };
    atual.total += Number(a.valor_repasse_bruno);
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro_id, atual);
  }

  const totalGeral = [...porBarbeiro.values()].reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Repasses (50%)
      </h1>
      <p className="mt-2 text-neutral-400">
        Valor devido ao Bruno referente aos atendimentos feitos por barbeiros
        parceiros (50% do valor de cada serviço).
      </p>

      <div className="mt-8 rounded-xl border border-gold/40 bg-gold/10 p-5">
        <p className="text-xs uppercase tracking-widest text-gold">Total acumulado</p>
        <p className="font-display text-4xl text-neutral-50">
          R$ {totalGeral.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {[...porBarbeiro.entries()].map(([id, v]) => (
          <div key={id} className="flex items-center justify-between rounded-xl border border-ink-line bg-ink-soft p-4">
            <div>
              <p className="font-semibold text-neutral-100">{v.nome}</p>
              <p className="text-xs text-neutral-500">{v.qtd} atendimento(s)</p>
            </div>
            <p className="font-display text-2xl text-gold-gradient">
              R$ {v.total.toFixed(2).replace(".", ",")}
            </p>
          </div>
        ))}
        {porBarbeiro.size === 0 && (
          <p className="text-sm text-neutral-500">Nenhum repasse registrado ainda.</p>
        )}
      </div>
    </div>
  );
}
