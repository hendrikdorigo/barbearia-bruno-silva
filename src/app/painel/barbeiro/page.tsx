import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendaBarbeiro from "@/components/AgendaBarbeiro";
import ConectarGoogleCalendar from "@/components/ConectarGoogleCalendar";
import EstatisticasCards from "@/components/EstatisticasCards";
import { calcularEstatisticas } from "@/lib/estatisticas";

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

      <div className="mt-10">
        <EstatisticasCards estatisticas={calcularEstatisticas(agendamentos ?? [])} />
        {barbeiro && !barbeiro.is_dono && (
          <p className="mt-2 text-xs text-muted-foreground">
            Sua comissão atual: <span className="text-gold">{barbeiro.comissao_percentual}%</span> do valor de cada serviço.
          </p>
        )}
      </div>

      <h2 className="mt-10 font-display text-3xl text-foreground">Minha agenda</h2>
      <AgendaBarbeiro agendamentos={agendamentos ?? []} />
    </div>
  );
}
