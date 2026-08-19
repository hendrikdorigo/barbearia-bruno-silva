import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 500 });
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: preAgendamento } = await supabase
    .from("pre_agendamentos")
    .select("status")
    .eq("token", token)
    .maybeSingle();

  if (!preAgendamento) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }
  if (preAgendamento.status !== "notificado") {
    return NextResponse.json({ error: "Esse link já foi usado." }, { status: 400 });
  }

  await supabase
    .from("pre_agendamentos")
    .update({ status: "recusado", updated_at: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.json({ ok: true });
}
