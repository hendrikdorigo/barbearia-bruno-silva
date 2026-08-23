import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sincronizarCriacaoEvento } from "@/lib/google-calendar-sync";

/**
 * Chamada pelo barbeiro logo após reservar um horário manualmente na
 * própria agenda (NovoAgendamentoBarbeiro.tsx), pra colocar o evento no
 * Google Calendar dele - mesmo papel de /api/agendamentos/[id]/criar, só
 * que autorizado pelo barbeiro_id em vez do cliente_id (aqui quem criou o
 * agendamento é o próprio barbeiro, não precisa avisar ele mesmo no sino).
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
    .eq("barbeiro_id", user.id)
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
