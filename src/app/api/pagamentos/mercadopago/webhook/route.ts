import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { consultarPagamento } from "@/lib/mercadopago";

/**
 * Notificação assíncrona do Mercado Pago. Nunca confia em dados vindos da
 * URL/query - sempre busca o pagamento real via consultarPagamento() usando
 * o id recebido, com o access token do servidor.
 */
const STATUS_MAP: Record<string, "aprovado" | "recusado" | "estornado" | "pendente"> = {
  approved: "aprovado",
  rejected: "recusado",
  cancelled: "recusado",
  refunded: "estornado",
  charged_back: "estornado",
  pending: "pendente",
  in_process: "pendente",
};

async function handle(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");
  const notifTipo = request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");

  if (!paymentId || notifTipo !== "payment") {
    return NextResponse.json({ ok: true });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ ok: true });
  }

  try {
    const pagamento = await consultarPagamento(paymentId);
    const [refTipo, refId] = (pagamento.external_reference ?? "").split(":");
    if (!refTipo || !refId) return NextResponse.json({ ok: true });

    const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    const statusPagamento = STATUS_MAP[pagamento.status] ?? "pendente";

    if (refTipo === "agendamento") {
      await admin
        .from("pagamentos")
        .update({ status: statusPagamento, gateway_referencia: String(pagamento.id) })
        .eq("agendamento_id", refId)
        .eq("status", "pendente");

      if (pagamento.status === "approved") {
        await admin
          .from("agendamentos")
          .update({ status: "confirmado", pagamento_antecipado: true })
          .eq("id", refId);
      }
    } else if (refTipo === "comanda") {
      const { data: comanda } = await admin
        .from("comandas")
        .select("agendamento_id")
        .eq("id", refId)
        .maybeSingle();

      if (comanda) {
        const { data: pagamentoAtualizado } = await admin
          .from("pagamentos")
          .update({ status: statusPagamento, gateway_referencia: String(pagamento.id) })
          .eq("agendamento_id", comanda.agendamento_id)
          .eq("status", "pendente")
          .select("metodo")
          .maybeSingle();

        if (pagamento.status === "approved") {
          await admin
            .from("comandas")
            .update({
              status: "paga",
              pago_antecipado: true,
              ...(pagamentoAtualizado ? { forma_pagamento: pagamentoAtualizado.metodo } : {}),
            })
            .eq("id", refId);
        }
      }
    }
  } catch (e) {
    console.error("Erro no webhook do Mercado Pago:", e);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
