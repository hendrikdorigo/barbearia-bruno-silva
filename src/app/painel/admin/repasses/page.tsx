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
    .select("*, barbeiros(profile_id, is_dono, comissao_percentual, profiles(nome))")
    .in("status", ["confirmado", "concluido"])
    .order("data_hora", { ascending: false });

  // Como o pagamento cai sempre na conta do Bruno, o que importa aqui é o
  // complemento de valor_repasse_bruno: quanto o Bruno precisa repassar
  // (pagar) para cada barbeiro parceiro pelos atendimentos que ele fez.
  const porBarbeiro = new Map<string, { nome: string; percentual: number; total: number; qtd: number }>();
  for (const a of agendamentos ?? []) {
    const barbeiro = (a as any).barbeiros;
    if (!barbeiro || barbeiro.is_dono) continue;
    const comissao = Number(a.valor_servico) - Number(a.valor_repasse_bruno);
    const atual = porBarbeiro.get(a.barbeiro_id) ?? {
      nome: barbeiro.profiles?.nome ?? "—",
      percentual: barbeiro.comissao_percentual,
      total: 0,
      qtd: 0,
    };
    atual.total += comissao;
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro_id, atual);
  }

  const totalGeral = [...porBarbeiro.values()].reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Comissões a repassar
      </h1>
      <p className="mt-2 text-muted-foreground">
        Como os pagamentos caem todos na sua conta, aqui está quanto você
        precisa repassar a cada barbeiro parceiro pelos atendimentos que ele
        fez. O percentual de cada um pode ser ajustado em &quot;Gerenciar
        barbeiros&quot;.
      </p>

      <Card className="mt-8 gap-1 border-gold/40 bg-gold/10 p-5">
        <p className="text-xs uppercase tracking-widest text-gold">Total a repassar</p>
        <p className="font-mono text-4xl font-medium text-foreground">
          R$ {totalGeral.toFixed(2).replace(".", ",")}
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        {[...porBarbeiro.entries()].map(([id, v]) => (
          <Card key={id} className="flex-row items-center justify-between border-border bg-ink-soft p-4">
            <div>
              <p className="font-semibold text-foreground">{v.nome}</p>
              <p className="text-xs text-muted-foreground">
                {v.qtd} atendimento(s) · {v.percentual}% de comissão
              </p>
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
