import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Detalhes de um pré-agendamento pelo token do link de WhatsApp. Sem login
 * - o token é a própria credencial (o link chega pelo WhatsApp, não pela
 * navegação normal do app), por isso roda com service role.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: preAgendamento } = await supabase
    .from("pre_agendamentos")
    .select("status, data_hora_prevista, barbeiros(profiles(nome)), servicos(nome, preco)")
    .eq("token", token)
    .maybeSingle();

  if (!preAgendamento) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }

  return NextResponse.json({
    status: preAgendamento.status,
    dataHoraPrevista: preAgendamento.data_hora_prevista,
    nomeBarbeiro: (preAgendamento as any).barbeiros?.profiles?.nome ?? "seu barbeiro",
    nomeServico: (preAgendamento as any).servicos?.nome ?? "atendimento",
    preco: (preAgendamento as any).servicos?.preco ?? null,
  });
}
