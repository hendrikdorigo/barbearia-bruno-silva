import { NextRequest, NextResponse } from "next/server";
import { confirmarPagamentoPorId } from "@/lib/mercadopago-confirmar";

/**
 * Notificação assíncrona do Mercado Pago. Nunca confia em dados vindos da
 * URL/query - a confirmação real acontece em confirmarPagamentoPorId(), que
 * re-busca o pagamento pela API usando o id recebido.
 */
async function handle(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");
  const notifTipo = request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");

  if (!paymentId || notifTipo !== "payment") {
    return NextResponse.json({ ok: true });
  }

  try {
    await confirmarPagamentoPorId(paymentId);
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
