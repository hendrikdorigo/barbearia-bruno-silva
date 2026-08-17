import { NextRequest, NextResponse } from "next/server";
import { confirmarPagamentoPorId } from "@/lib/mercadopago-confirmar";

/**
 * A página do QR Code Pix consulta esta rota a cada poucos segundos enquanto
 * aguarda o pagamento. Além de devolver o status, ela mesma confirma o
 * pagamento no banco (mesma lógica do webhook) - cobre o caso do webhook do
 * Mercado Pago demorar ou não chegar (ex: testes locais).
 */
export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
  }

  try {
    const status = await confirmarPagamentoPorId(paymentId);
    return NextResponse.json({ status });
  } catch (e) {
    console.error("Erro ao consultar status do pagamento Pix:", e);
    return NextResponse.json({ error: "Não foi possível consultar o pagamento." }, { status: 502 });
  }
}
