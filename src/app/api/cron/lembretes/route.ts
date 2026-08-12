import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { enviarMensagemWhatsapp } from "@/lib/whatsapp";

/**
 * Job de envio dos lembretes de WhatsApp (fila `lembretes_whatsapp`).
 * -----------------------------------------------------------------------
 * Busca lembretes com status "agendado" cujo `agendado_para` já chegou,
 * tenta enviar via `enviarMensagemWhatsapp` (adapter em src/lib/whatsapp.ts)
 * e atualiza o status (enviado/falhou) + log de tentativas.
 *
 * Enquanto WHATSAPP_API_TOKEN não estiver configurado, os envios vão
 * falhar de forma controlada e ficar registrados em `erro`, sem quebrar
 * o restante do sistema. Agende este endpoint da mesma forma descrita
 * em /api/cron/no-show (README tem o passo a passo).
 */
function autorizado(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${process.env.CRON_SECRET}`) return true;
  const legacy = request.headers.get("x-cron-secret");
  return legacy === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  return handleLembretes(request);
}

export async function POST(request: NextRequest) {
  return handleLembretes(request);
}

async function handleLembretes(request: NextRequest) {
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

  const { data: lembretes } = await supabase
    .from("lembretes_whatsapp")
    .select("*, agendamentos(cliente_id, clientes(profile_id, profiles(telefone)))")
    .eq("status_envio", "agendado")
    .lte("agendado_para", new Date().toISOString())
    .limit(50);

  let enviados = 0;
  let falhas = 0;

  for (const l of (lembretes as any[]) ?? []) {
    const telefone = l.agendamentos?.clientes?.profiles?.telefone ?? null;
    const resultado = await enviarMensagemWhatsapp(telefone, l.mensagem ?? "");

    if (resultado.sucesso) {
      enviados++;
      await supabase
        .from("lembretes_whatsapp")
        .update({
          status_envio: "enviado",
          enviado_em: new Date().toISOString(),
          telefone_destino: telefone,
          tentativas: l.tentativas + 1,
        })
        .eq("id", l.id);
    } else {
      falhas++;
      await supabase
        .from("lembretes_whatsapp")
        .update({
          status_envio: "falhou",
          erro: resultado.erro,
          tentativas: l.tentativas + 1,
        })
        .eq("id", l.id);
    }
  }

  return NextResponse.json({ enviados, falhas });
}
