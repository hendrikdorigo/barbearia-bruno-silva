/**
 * INTEGRAÇÃO MERCADO PAGO (Pix direto, com QR Code)
 * -----------------------------------------------------------------------
 * Pagamento antecipado real, aceitando somente Pix. O cliente nunca sai do
 * site: geramos um pagamento Pix via API do Mercado Pago e mostramos o QR
 * Code (+ código "copia e cola") na própria página.
 *
 * Variável de ambiente necessária: MERCADOPAGO_ACCESS_TOKEN (Access Token
 * de produção, obtido em https://www.mercadopago.com.br/developers -> Suas
 * integrações -> credenciais de produção).
 *
 * Fluxo:
 *   1. Cliente escolhe "Pagar agora" (Pix) -> o navegador chama
 *      POST /api/pagamentos/mercadopago/criar-pix (ou -comanda), que cria o
 *      pagamento via criarPagamentoPix() e devolve o QR Code em base64 e o
 *      código copia-e-cola.
 *   2. A página fica mostrando o QR Code e consultando periodicamente
 *      GET /api/pagamentos/mercadopago/status?paymentId=... até o pagamento
 *      aprovar.
 *   3. Em paralelo, o Mercado Pago também notifica
 *      POST /api/pagamentos/mercadopago/webhook de forma assíncrona - ambos
 *      os caminhos usam confirmarPagamentoPorId() (nunca confiam em dados
 *      vindos só do cliente, sempre re-consultam o pagamento pela API).
 */

const MP_API_BASE = "https://api.mercadopago.com";

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export async function criarPagamentoPix(params: {
  /** Formato "agendamento:<id>" ou "comanda:<id>" - o webhook usa o prefixo para saber o que confirmar. */
  externalReference: string;
  descricao: string;
  valor: number;
  emailComprador: string;
  baseUrl: string;
}) {
  const resp = await fetch(`${MP_API_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: params.valor,
      description: params.descricao,
      payment_method_id: "pix",
      payer: { email: params.emailComprador },
      external_reference: params.externalReference,
      notification_url: `${params.baseUrl}/api/pagamentos/mercadopago/webhook`,
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();

  const qrCodeBase64: string | undefined = data.point_of_interaction?.transaction_data?.qr_code_base64;
  const qrCode: string | undefined = data.point_of_interaction?.transaction_data?.qr_code;
  if (!qrCodeBase64 || !qrCode) {
    throw new Error("Mercado Pago não retornou o QR Code do Pix.");
  }

  return {
    paymentId: String(data.id),
    status: data.status as string,
    qrCodeBase64,
    qrCode,
  };
}

export async function consultarPagamento(paymentId: string) {
  const resp = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{
    id: number;
    status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "refunded" | "charged_back";
    external_reference: string;
    transaction_amount: number;
  }>;
}
