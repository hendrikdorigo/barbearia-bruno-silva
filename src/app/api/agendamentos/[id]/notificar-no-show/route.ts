import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarClienteStatusAgendamento } from "@/lib/notificar-cliente-whatsapp";

/**
 * Avisa o cliente por WhatsApp que ele foi marcado como no-show. Chamada
 * pelo painel do barbeiro logo após a RPC marcar_no_show ter sucesso
 * (essa RPC já faz a mudança de status no banco - aqui só cuida do aviso).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("barbeiro_id")
    .eq("id", id)
    .single();

  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const podeAvisar = user.id === agendamento.barbeiro_id || perfil?.role === "admin";
  if (!podeAvisar) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    await notificarClienteStatusAgendamento(id, "no_show");
  } catch (e) {
    console.error("Erro ao notificar cliente por WhatsApp (no-show):", e);
  }

  return NextResponse.json({ ok: true });
}
