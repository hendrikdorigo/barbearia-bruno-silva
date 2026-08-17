import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { gerarSlots, slotBloqueado } from "@/lib/constants";

export type JanelaDia = { atende: boolean; horaInicio: string; horaFim: string };

/**
 * Janela de atendimento de um barbeiro numa data: exceção específica daquela
 * data tem prioridade, senão cai no horário padrão do dia da semana, senão
 * abre 09:00-19:30 (exceto domingo). Mesma regra usada em /agendar/[id].
 */
export async function calcularJanelaDia(
  supabase: SupabaseClient<Database>,
  barbeiroId: string,
  data: string
): Promise<JanelaDia> {
  const diaSemana = new Date(`${data}T00:00:00`).getDay();

  const { data: excecao } = await supabase
    .from("barbeiro_excecoes")
    .select("*")
    .eq("barbeiro_id", barbeiroId)
    .eq("data", data)
    .maybeSingle();

  if (excecao) {
    return {
      atende: Boolean(excecao.ativo),
      horaInicio: excecao.hora_inicio?.slice(0, 5) ?? "09:00",
      horaFim: excecao.hora_fim?.slice(0, 5) ?? "19:30",
    };
  }

  const { data: horarioDia } = await supabase
    .from("barbeiro_horarios")
    .select("*")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  if (horarioDia) {
    return {
      atende: Boolean(horarioDia.ativo),
      horaInicio: horarioDia.hora_inicio?.slice(0, 5) ?? "09:00",
      horaFim: horarioDia.hora_fim?.slice(0, 5) ?? "19:30",
    };
  }

  return { atende: diaSemana !== 0, horaInicio: "09:00", horaFim: "19:30" };
}

/** Horários livres (HH:MM) de um barbeiro numa data, já descontando ocupados e bloqueios. */
export async function calcularSlotsLivres(
  supabase: SupabaseClient<Database>,
  barbeiroId: string,
  data: string
): Promise<string[]> {
  const janela = await calcularJanelaDia(supabase, barbeiroId, data);
  if (!janela.atende) return [];

  const diaSemana = new Date(`${data}T00:00:00`).getDay();
  const inicio = `${data}T00:00:00`;
  const fim = `${data}T23:59:59`;

  const [{ data: agendamentos }, { data: bloqueios }] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("data_hora")
      .eq("barbeiro_id", barbeiroId)
      .gte("data_hora", inicio)
      .lte("data_hora", fim)
      .in("status", ["pendente", "confirmado"]),
    supabase
      .from("barbeiro_bloqueios")
      .select("hora_inicio, hora_fim, dia_semana, data")
      .eq("barbeiro_id", barbeiroId)
      .or(`dia_semana.eq.${diaSemana},data.eq.${data}`),
  ]);

  const ocupados = (agendamentos ?? []).map((a) => new Date(a.data_hora).toTimeString().slice(0, 5));
  const slots = gerarSlots(janela.horaInicio, janela.horaFim);
  return slots.filter((s) => !ocupados.includes(s) && !slotBloqueado(s, bloqueios ?? []));
}

/** Horários livres de vários barbeiros na mesma data, em paralelo. */
export async function calcularSlotsLivresPorBarbeiro(
  supabase: SupabaseClient<Database>,
  barbeiroIds: string[],
  data: string
): Promise<Record<string, string[]>> {
  const entradas = await Promise.all(
    barbeiroIds.map(async (id) => [id, await calcularSlotsLivres(supabase, id, data)] as const)
  );
  return Object.fromEntries(entradas);
}
