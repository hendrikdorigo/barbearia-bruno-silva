import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GestaoBarbeiros from "@/components/GestaoBarbeiros";

export default async function AdminBarbeirosPage() {
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

  const { data: barbeiros } = await supabase
    .from("barbeiros")
    .select("*, profiles(nome, telefone)")
    .order("created_at");

  const { data: agendamentosBarbeiros } = await supabase.from("agendamentos").select("barbeiro_id");
  const barbeirosComHistorico = new Set((agendamentosBarbeiros ?? []).map((a) => a.barbeiro_id));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Gerenciar barbeiros
      </h1>
      <GestaoBarbeiros
        barbeiros={(barbeiros ?? []) as any[]}
        barbeirosComHistorico={[...barbeirosComHistorico]}
      />
    </div>
  );
}
