import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { calcularSlotsLivres } from "@/lib/disponibilidade";
import { sincronizarCriacaoEvento } from "@/lib/google-calendar-sync";
import { notificarBarbeiroNovoAgendamento } from "@/lib/notificar-barbeiro";

/**
 * Confirma um pré-agendamento pelo token (sem login). Revalida se o
 * horário ainda está livre antes de criar o agendamento de verdade -
 * pode ter passado bastante tempo entre o WhatsApp ser enviado e o
 * cliente clicar.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: preAgendamento } = await supabase
    .from("pre_agendamentos")
    .select("*, servicos(preco)")
    .eq("token", token)
    .maybeSingle();

  if (!preAgendamento) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }

  if (preAgendamento.status !== "notificado") {
    return NextResponse.json({ error: "Esse link já foi usado." }, { status: 400 });
  }

  const data = preAgendamento.data_hora_prevista.slice(0, 10);
  const horaPrevista = preAgendamento.data_hora_prevista.slice(11, 16);
  const slotsLivres = await calcularSlotsLivres(supabase, preAgendamento.barbeiro_id, data);

  if (!slotsLivres.includes(horaPrevista)) {
    return NextResponse.json(
      { error: "Esse horário não está mais livre. Escolha outro horário pelo app." },
      { status: 409 }
    );
  }

  const { data: agendamento, error: agendamentoError } = await supabase
    .from("agendamentos")
    .insert({
      cliente_id: preAgendamento.cliente_id,
      barbeiro_id: preAgendamento.barbeiro_id,
      servico_id: preAgendamento.servico_id,
      data_hora: preAgendamento.data_hora_prevista,
      status: "confirmado",
      pagamento_antecipado: false,
      valor_servico: (preAgendamento as any).servicos?.preco ?? 0,
    })
    .select("id")
    .single();

  if (agendamentoError || !agendamento) {
    return NextResponse.json(
      { error: agendamentoError?.message ?? "Não foi possível criar o agendamento." },
      { status: 400 }
    );
  }

  await supabase
    .from("pre_agendamentos")
    .update({ status: "confirmado", agendamento_id: agendamento.id, updated_at: new Date().toISOString() })
    .eq("token", token);

  try {
    await sincronizarCriacaoEvento(agendamento.id);
  } catch (e) {
    console.error("Erro na sincronização com Google Calendar:", e);
  }
  try {
    await notificarBarbeiroNovoAgendamento(agendamento.id);
  } catch (e) {
    console.error("Erro ao notificar barbeiro do novo agendamento:", e);
  }

  return NextResponse.json({ ok: true });
}
