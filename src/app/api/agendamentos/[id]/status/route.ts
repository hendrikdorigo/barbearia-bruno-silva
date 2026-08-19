import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sincronizarCancelamentoEvento, sincronizarCriacaoEvento } from "@/lib/google-calendar-sync";

/**
 * Muda o status de um agendamento. O evento no Google Calendar do barbeiro
 * (quando conectado) e criado assim que o agendamento e feito (ver
 * /api/agendamentos/[id]/criar), nao quando o barbeiro confirma - aqui so
 * garantimos que ele seja removido ao cancelar, e criado como fallback caso
 * a sincronizacao inicial tenha falhado. Falha na integracao com o Google
 * nao deve impedir a troca de status.
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
    .select("id, cliente_id, barbeiro_id")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  const ehCliente = user.id === agendamento.cliente_id;
  const ehBarbeiroOuAdmin = user.id === agendamento.barbeiro_id || perfil?.role === "admin";

  if (!ehCliente && !ehBarbeiroOuAdmin) {
    return NextResponse.json({ error: "Você não pode alterar este agendamento." }, { status: 403 });
  }
  // Cliente só pode cancelar o próprio horário - confirmar/concluir é ação
  // do barbeiro (ou admin).
  if (ehCliente && !ehBarbeiroOuAdmin && status !== "cancelado") {
    return NextResponse.json({ error: "Você só pode cancelar este agendamento." }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  try {
    if (status === "cancelado") {
      await sincronizarCancelamentoEvento(id);
    } else {
      // fallback: cria o evento aqui caso a sincronizacao no momento do
      // agendamento (POST /api/agendamentos/[id]/criar) tenha falhado.
      await sincronizarCriacaoEvento(id);
    }
  } catch (e) {
    console.error("Erro na sincronização com Google Calendar:", e);
  }

  return NextResponse.json({ ok: true });
}
