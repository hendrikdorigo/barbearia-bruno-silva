import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { TOLERANCIA_ATRASO_MINUTOS } from "@/lib/constants";

/**
 * Job automático de "no-show" (atraso > 15 minutos).
 * -----------------------------------------------------------------------
 * Cancela automaticamente agendamentos "pendente"/"confirmado" cujo
 * horário já passou da tolerância de atraso e não houve check-in.
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY (chave secreta, NUNCA exposta ao
 * cliente) para poder atualizar registros de qualquer usuário.
 *
 * Como agendar (documentado no README):
 *   - Vercel Cron Jobs (vercel.json → "crons"): envia GET com header
 *     "authorization: Bearer <CRON_SECRET>" automaticamente.
 *   - Netlify Scheduled Functions (netlify/functions com config.schedule), ou
 *   - Um cron externo (ex: cron-job.org / GitHub Actions) fazendo POST
 *     para /api/cron/no-show a cada poucos minutos, com o header
 *     "x-cron-secret" igual à env var CRON_SECRET.
 */
function autorizado(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const legacy = request.headers.get("x-cron-secret");
  return legacy === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  return handleNoShow(request);
}

export async function POST(request: NextRequest) {
  return handleNoShow(request);
}

async function handleNoShow(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY não configurada" },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  const limite = new Date(
    Date.now() - TOLERANCIA_ATRASO_MINUTOS * 60 * 1000
  ).toISOString();

  const { data: atrasados } = await supabase
    .from("agendamentos")
    .select("id")
    .in("status", ["pendente", "confirmado"])
    .lt("data_hora", limite)
    .is("checkin_at", null);

  let processados = 0;
  for (const a of atrasados ?? []) {
    const { error } = await supabase.rpc("marcar_no_show", {
      p_agendamento_id: a.id,
    });
    if (!error) processados++;
  }

  return NextResponse.json({ processados });
}
