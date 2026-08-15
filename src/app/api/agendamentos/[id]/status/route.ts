import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { criarEventoAgenda, excluirEventoAgenda, refreshAccessToken } from "@/lib/google-calendar";

/**
 * Muda o status de um agendamento e, se o barbeiro tiver o Google Calendar
 * conectado, sincroniza o evento: cria ao confirmar, remove ao cancelar.
 *
 * A troca de status usa a sessão do usuário (RLS decide quem pode alterar
 * o quê - cliente dono ou barbeiro dono do agendamento). Os tokens do
 * Google, porém, só são legíveis pelo próprio barbeiro (RLS em
 * google_calendar_tokens) - como um cliente cancelando também precisa
 * disparar a remoção do evento do barbeiro, essa parte usa a service role.
 * Falha na integração com o Google não deve impedir a troca de status.
 */
const STATUS_PERMITIDOS = ["confirmado", "cancelado", "concluido"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!STATUS_PERMITIDOS.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select(
      "id, data_hora, google_event_id, barbeiro_id, barbeiros(google_calendar_connected), clientes(profiles(nome)), servicos(nome, duracao_minutos)"
    )
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const barbeiroConectado = (agendamento as any).barbeiros?.google_calendar_connected;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (barbeiroConectado && serviceKey) {
    try {
      const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

      const { data: tokenRow } = await admin
        .from("google_calendar_tokens")
        .select("access_token, refresh_token, expiry")
        .eq("barbeiro_id", (agendamento as any).barbeiro_id)
        .maybeSingle();

      if (tokenRow?.refresh_token) {
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
            .eq("barbeiro_id", (agendamento as any).barbeiro_id);
        }

        let googleEventId: string | null = (agendamento as any).google_event_id ?? null;

        if (status === "confirmado" && !googleEventId) {
          const inicio = new Date((agendamento as any).data_hora);
          const duracao = (agendamento as any).servicos?.duracao_minutos ?? 30;
          const fim = new Date(inicio.getTime() + duracao * 60000);
          const nomeCliente = (agendamento as any).clientes?.profiles?.nome ?? "Cliente";
          const nomeServico = (agendamento as any).servicos?.nome ?? "Atendimento";

          const evento = await criarEventoAgenda({
            accessToken,
            titulo: `${nomeServico} - ${nomeCliente}`,
            descricao: "Agendamento confirmado pela Barbearia Bruno Silva.",
            inicioISO: inicio.toISOString(),
            fimISO: fim.toISOString(),
          });

          if (evento.id) {
            await admin.from("agendamentos").update({ google_event_id: evento.id }).eq("id", id);
          }
        } else if (status === "cancelado" && googleEventId) {
          await excluirEventoAgenda(accessToken, googleEventId);
          await admin.from("agendamentos").update({ google_event_id: null }).eq("id", id);
        }
      }
    } catch (e) {
      console.error("Erro na sincronização com Google Calendar:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
