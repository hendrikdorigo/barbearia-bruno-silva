import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sincronizarCriacaoEvento } from "@/lib/google-calendar-sync";

/**
 * Chamada pelo cliente logo apos criar um agendamento, para colocar o
 * evento no Google Calendar do barbeiro imediatamente - sem esperar o
 * barbeiro confirmar. Falha aqui nunca deve travar a tela de agendamento
 * (o agendamento em si ja foi criado antes desta chamada).
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
    .select("id")
    .eq("id", id)
    .eq("cliente_id", user.id)
    .maybeSingle();

  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  try {
    await sincronizarCriacaoEvento(id);
  } catch (e) {
    console.error("Erro na sincronização com Google Calendar:", e);
  }

  return NextResponse.json({ ok: true });
}
