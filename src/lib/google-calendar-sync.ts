import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { criarEventoAgenda, excluirEventoAgenda, refreshAccessToken } from "@/lib/google-calendar";

/**
 * Cria (se ainda nao existir) ou remove o evento no Google Calendar do
 * barbeiro dono do agendamento. Usa a service role porque os tokens do
 * barbeiro (google_calendar_tokens) so sao legiveis por ele mesmo via RLS,
 * mas quem dispara essas funcoes pode ser o cliente (ao agendar/cancelar)
 * ou o barbeiro (ao confirmar/concluir/cancelar). Falhas aqui nunca devem
 * impedir a acao principal (agendar, confirmar, cancelar) - quem chama
 * deve envolver a chamada em try/catch e apenas logar o erro.
 */
async function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

async function obterAccessTokenValido(admin: ReturnType<typeof createServiceClient<Database>>, barbeiroId: string) {
  const { data: tokenRow } = await admin
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, expiry")
    .eq("barbeiro_id", barbeiroId)
    .maybeSingle();

  if (!tokenRow?.refresh_token) return null;

  let accessToken = tokenRow.access_token ?? "";
  const perto = !tokenRow.expiry || new Date(tokenRow.expiry).getTime() < Date.now() + 60_000;

  if (perto) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token);
    accessToken = refreshed.access_token;
    await admin
      .from("google_calendar_tokens")
      .update({
        access_token: accessToken,
        expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("barbeiro_id", barbeiroId);
  }

  return accessToken;
}

export async function sincronizarCriacaoEvento(agendamentoId: string) {
  const admin = await getAdmin();
  if (!admin) return;

  const { data: agendamento } = await admin
    .from("agendamentos")
    .select(
      "id, data_hora, google_event_id, barbeiro_id, status, barbeiros(google_calendar_connected), clientes(profiles(nome)), servicos(nome, duracao_minutos)"
    )
    .eq("id", agendamentoId)
    .single();

  if (!agendamento) return;
  if (agendamento.google_event_id) return;
  if (agendamento.status === "cancelado") return;
  if (!(agendamento as any).barbeiros?.google_calendar_connected) return;

  const accessToken = await obterAccessTokenValido(admin, agendamento.barbeiro_id);
  if (!accessToken) return;

  const inicio = new Date(agendamento.data_hora);
  const duracao = (agendamento as any).servicos?.duracao_minutos ?? 30;
  const fim = new Date(inicio.getTime() + duracao * 60000);
  const nomeCliente = (agendamento as any).clientes?.profiles?.nome ?? "Cliente";
  const nomeServico = (agendamento as any).servicos?.nome ?? "Atendimento";

  const evento = await criarEventoAgenda({
    accessToken,
    titulo: `${nomeServico} - ${nomeCliente}`,
    descricao: "Agendamento na Barbearia Bruno Silva.",
    inicioISO: inicio.toISOString(),
    fimISO: fim.toISOString(),
  });

  if (evento.id) {
    await admin.from("agendamentos").update({ google_event_id: evento.id }).eq("id", agendamentoId);
  }
}

export async function sincronizarCancelamentoEvento(agendamentoId: string) {
  const admin = await getAdmin();
  if (!admin) return;

  const { data: agendamento } = await admin
    .from("agendamentos")
    .select("id, google_event_id, barbeiro_id, barbeiros(google_calendar_connected)")
    .eq("id", agendamentoId)
    .single();

  if (!agendamento?.google_event_id) return;
  if (!(agendamento as any).barbeiros?.google_calendar_connected) return;

  const accessToken = await obterAccessTokenValido(admin, agendamento.barbeiro_id);
  if (!accessToken) return;

  await excluirEventoAgenda(accessToken, agendamento.google_event_id);
  await admin.from("agendamentos").update({ google_event_id: null }).eq("id", agendamentoId);
}
