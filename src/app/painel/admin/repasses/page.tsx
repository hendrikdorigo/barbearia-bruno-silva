import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { WalletIcon } from "lucide-react";

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
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Repasses (50%)
      </h1>
      <p className="mt-2 text-muted-foreground">
        Valor devido ao Bruno referente aos atendimentos feitos por barbeiros
        parceiros (50% do valor de cada serviço).
      </p>

      <Card className="mt-8 gap-1 border-gold/40 bg-gold/10 p-5">
        <p className="text-xs uppercase tracking-widest text-gold">Total acumulado</p>
        <p className="font-mono text-4xl font-medium text-foreground">
          R$ {totalGeral.toFixed(2).replace(".", ",")}
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        {[...porBarbeiro.entries()].map(([id, v]) => (
          <Card key={id} className="flex-row items-center justify-between border-border bg-ink-soft p-4">
            <div>
              <p className="font-semibold text-foreground">{v.nome}</p>
              <p className="text-xs text-muted-foreground">{v.qtd} atendimento(s)</p>
            </div>
            <p className="font-mono text-2xl font-medium text-gold-gradient">
              R$ {v.total.toFixed(2).replace(".", ",")}
            </p>
          </Card>
        ))}
        {porBarbeiro.size === 0 && (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WalletIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum repasse registrado ainda</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
