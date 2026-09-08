import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RepassesPainel from "@/components/RepassesPainel";

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

  const [{ data: agendamentosBrutos }, { data: pagamentos }, { data: barbeirosOcultos }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select(
        "*, barbeiros(profile_id, is_dono, comissao_percentual, comissao_produtos_percentual, profiles(nome)), clientes(profiles(nome)), servicos(nome), comandas(id, valor_produtos, valor_repasse_produtos)"
      )
      .in("status", ["confirmado", "concluido"])
      .order("data_hora", { ascending: false }),
    supabase
      .from("repasses_pagamentos")
      .select("*, profiles!repasses_pagamentos_criado_por_fkey(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("barbeiros").select("profile_id").eq("oculto", true),
  ]);

  // Conta de teste/dev fica de fora de qualquer relatório do admin.
  const idsOcultos = new Set((barbeirosOcultos ?? []).map((b) => b.profile_id));
  const agendamentos = (agendamentosBrutos ?? []).filter((a) => !idsOcultos.has(a.barbeiro_id));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Comissões a repassar
      </h1>
      <p className="mt-2 text-muted-foreground">
        Como os pagamentos caem todos na sua conta, aqui está quanto você
        precisa repassar a cada barbeiro parceiro pelos atendimentos que ele
        fez, já somando a comissão de produtos vendidos por ele. Os
        percentuais (serviço e produtos) podem ser ajustados em &quot;Gerenciar
        barbeiros&quot;. Clique num barbeiro pra ver o histórico detalhado e
        registrar um pagamento.
      </p>

      <RepassesPainel
        agendamentos={agendamentos as any[]}
        pagamentosIniciais={(pagamentos ?? []) as any[]}
      />
    </div>
  );
}
