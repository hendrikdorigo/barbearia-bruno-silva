import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HorariosEditor from "@/components/HorariosEditor";
import ExcecoesEditor from "@/components/ExcecoesEditor";
import BloqueiosEditor from "@/components/BloqueiosEditor";

export default async function HorariosBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: barbeiro } = await supabase
    .from("barbeiros")
    .select("profile_id")
    .eq("profile_id", user.id)
    .single();

  if (!barbeiro) redirect("/");

  const { data: horarios } = await supabase
    .from("barbeiro_horarios")
    .select("*")
    .eq("barbeiro_id", user.id)
    .order("dia_semana");

  const hoje = new Date().toISOString().slice(0, 10);
  const { data: excecoes } = await supabase
    .from("barbeiro_excecoes")
    .select("*")
    .eq("barbeiro_id", user.id)
    .gte("data", hoje)
    .order("data");

  const { data: bloqueios } = await supabase
    .from("barbeiro_bloqueios")
    .select("*")
    .eq("barbeiro_id", user.id)
    .or(`data.is.null,data.gte.${hoje}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl tracking-wide text-neutral-50">
        Meus horários
      </h1>
      <p className="mt-2 text-neutral-400">
        Escolha os dias em que você atende e o horário de início/fim de cada
        um. Os clientes só vão poder agendar dentro dessa janela.
      </p>
      <HorariosEditor barbeiroId={user.id} horariosIniciais={horarios ?? []} />

      <h2 className="mt-14 font-display text-3xl tracking-wide text-neutral-50">
        Folgas e exceções
      </h2>
      <p className="mt-2 text-neutral-400">
        Vai tirar uma folga num dia específico (ex: 10/08) ou tem um
        compromisso que muda seu horário só naquele dia (ex: 25/07)? Cadastre
        aqui — isso tem prioridade sobre o horário padrão da semana.
      </p>
      <ExcecoesEditor barbeiroId={user.id} excecoesIniciais={excecoes ?? []} />

      <h2 className="mt-14 font-display text-3xl tracking-wide text-neutral-50">
        Almoço e compromissos
      </h2>
      <p className="mt-2 text-neutral-400">
        Bloqueie uma janela de horário toda semana (ex: almoço 12h–13h) ou em
        uma data específica (ex: dentista às 15h). Esses horários somem da
        agenda automaticamente, sem precisar desligar o dia inteiro.
      </p>
      <BloqueiosEditor barbeiroId={user.id} bloqueiosIniciais={bloqueios ?? []} />
    </div>
  );
}
