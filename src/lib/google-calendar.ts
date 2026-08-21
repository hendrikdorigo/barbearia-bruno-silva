/**
 * INTEGRAÇÃO GOOGLE CALENDAR (OAuth por barbeiro)
 * -----------------------------------------------------------------------
 * Cada barbeiro conecta a própria conta Google a partir do painel dele.
 * Variáveis de ambiente necessárias (preencher depois em console.cloud.google.com):
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - GOOGLE_REDIRECT_URI  (ex: https://SEU-DOMINIO.netlify.app/api/google/callback)
 *
 * Fluxo:
 *   1. Barbeiro clica em "Conectar Google Calendar" no painel dele
 *      -> GET /api/google/connect redireciona para getGoogleAuthUrl().
 *   2. Google redireciona de volta para /api/google/callback com um "code".
 *   3. trocarCodePorTokens() troca o code pelos tokens (access + refresh)
 *      e eles são salvos em `barbeiros.google_calendar_access_token` /
 *      `google_calendar_refresh_token`.
 *   4. Sempre que um agendamento desse barbeiro é confirmado ou cancelado,
 *      a rota /api/agendamentos/[id]/status chama `criarEventoAgenda()` ou
 *      `excluirEventoAgenda()`, renovando o access token via
 *      `refreshAccessToken()` quando necessário.
 *
 * Os tokens ficam na tabela `google_calendar_tokens` (RLS restrita ao
 * próprio barbeiro/admin) e nunca na tabela `barbeiros`, que tem leitura
 * pública.
 *
 * Sem as credenciais preenchidas, as funções abaixo lançam um erro
 * amigável e o botão de conectar no painel fica desabilitado com um aviso.
 */

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export function googleCalendarConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(state: string): string {
  if (!googleCalendarConfigurado()) {
    throw new Error(
      "Google Calendar ainda nao configurado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI."
    );
  }
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events",
    state,
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function trocarCodePorTokens(code: string) {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function criarEventoAgenda(params: {
  accessToken: string;
  titulo: string;
  descricao: string;
  inicioISO: string;
  fimISO: string;
  agendamentoId: string;
}) {
  const resp = await fetch(GOOGLE_CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: params.titulo,
      description: params.descricao,
      start: { dateTime: params.inicioISO, timeZone: "America/Sao_Paulo" },
      end: { dateTime: params.fimISO, timeZone: "America/Sao_Paulo" },
      // Marca o evento com o id do agendamento - permite achar e apagar o
      // evento depois mesmo se agendamentos.google_event_id não tiver sido
      // salvo por algum motivo (ex: falha de rede logo após criar o evento).
      extendedProperties: { private: { agendamentoId: params.agendamentoId } },
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ id: string }>;
}

export async function excluirEventoAgenda(accessToken: string, eventId: string) {
  const resp = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 (Gone) significa que o evento já não existe mais - trata como sucesso.
  if (!resp.ok && resp.status !== 404 && resp.status !== 410) {
    throw new Error(await resp.text());
  }
}

/**
 * Busca, pela etiqueta extendedProperties.private.agendamentoId, um evento
 * já criado no Google Calendar pra esse agendamento - usado como
 * fallback no cancelamento quando agendamentos.google_event_id está nulo
 * (evento existe no Google mas o vínculo no nosso banco se perdeu).
 */
export async function buscarEventoIdPorAgendamento(
  accessToken: string,
  agendamentoId: string
): Promise<string | null> {
  const params = new URLSearchParams({
    privateExtendedProperty: `agendamentoId=${agendamentoId}`,
    maxResults: "1",
  });
  const resp = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const json = (await resp.json()) as { items?: { id: string }[] };
  return json.items?.[0]?.id ?? null;
}
