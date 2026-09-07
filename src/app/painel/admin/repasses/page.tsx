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

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      "*, barbeiros(profile_id, is_dono, comissao_percentual, profiles(nome)), clientes(profiles(nome)), servicos(nome)"
    )
    .in("status", ["confirmado", "concluido"])
    .order("data_hora", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Comissões a repassar
      </h1>
      <p className="mt-2 text-muted-foreground">
        Como os pagamentos caem todos na sua conta, aqui está quanto você
        precisa repassar a cada barbeiro parceiro pelos atendimentos que ele
        fez. O percentual de cada um pode ser ajustado em &quot;Gerenciar
        barbeiros&quot;. Clique num barbeiro pra ver o histórico detalhado.
      </p>

      <RepassesPainel agendamentos={(agendamentos ?? []) as any[]} />
    </div>
  );
}
