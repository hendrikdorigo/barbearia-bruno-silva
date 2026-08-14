import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendaBarbeiro from "@/components/AgendaBarbeiro";
import ConectarGoogleCalendar from "@/components/ConectarGoogleCalendar";

export default async function PainelBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nome")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "barbeiro" && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("*, clientes(profile_id, profiles(nome, telefone)), servicos(nome, preco)")
    .eq("barbeiro_id", user.id)
    .order("data_hora", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Olá, {profile.nome.split(" ")[0]}
      </h1>

      <ConectarGoogleCalendar conectado={barbeiro?.google_calendar_connected ?? false} />

      <h2 className="mt-10 font-display text-3xl text-foreground">Minha agenda</h2>
      <AgendaBarbeiro agendamentos={agendamentos ?? []} />
    </div>
  );
}
