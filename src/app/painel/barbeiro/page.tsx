import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AgendaCalendario from "@/components/AgendaCalendario";
import ConectarGoogleCalendar from "@/components/ConectarGoogleCalendar";
import EstatisticasCards from "@/components/EstatisticasCards";
import NovoAgendamentoBarbeiro from "@/components/NovoAgendamentoBarbeiro";
import { calcularEstatisticas } from "@/lib/estatisticas";

export default async function PainelBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: barbeiro },
    { data: agendamentos },
    { data: horarios },
    { data: excecoes },
    { data: bloqueios },
  ] = await Promise.all([
    supabase.from("profiles").select("role, nome").eq("id", user.id).single(),
    supabase.from("barbeiros").select("*").eq("profile_id", user.id).single(),
    supabase
      .from("agendamentos")
      .select("*, clientes(profile_id, profiles(nome, telefone)), servicos(nome, preco, duracao_minutos)")
      .eq("barbeiro_id", user.id)
      .order("data_hora", { ascending: true }),
    supabase.from("barbeiro_horarios").select("*").eq("barbeiro_id", user.id),
    supabase.from("barbeiro_excecoes").select("*").eq("barbeiro_id", user.id),
    supabase.from("barbeiro_bloqueios").select("*").eq("barbeiro_id", user.id),
  ]);

  if (!profile || (profile.role !== "barbeiro" && profile.role !== "admin")) {
    redirect("/");
  }

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

      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-foreground">Minha agenda</h2>
        <NovoAgendamentoBarbeiro barbeiroId={user.id} />
      </div>
      <AgendaCalendario
        agendamentos={agendamentos ?? []}
        horarios={horarios ?? []}
        excecoes={excecoes ?? []}
        bloqueios={bloqueios ?? []}
      />
    </div>
  );
}
