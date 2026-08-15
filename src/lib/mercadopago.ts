/**
 * INTEGRAÇÃO MERCADO PAGO (Checkout Pro)
 * -----------------------------------------------------------------------
 * Pagamento antecipado real via redirecionamento para o checkout hospedado
 * do Mercado Pago (cliente sai do site, paga (cartão/Pix/boleto) e volta).
 *
 * Variável de ambiente necessária: MERCADOPAGO_ACCESS_TOKEN (Access Token
 * de produção, obtido em https://www.mercadopago.com.br/developers -> Suas
 * integrações -> credenciais de produção).
 *
 * Fluxo:
 *   1. Cliente escolhe "Pagar agora" em /agendar/[barbeiroId] -> o
 *      agendamento é criado com status "pendente" e o navegador chama
 *      POST /api/pagamentos/mercadopago/criar-preferencia.
 *   2. Essa rota cria uma "preference" via criarPreferenciaPagamento() e
 *      retorna o init_point (URL do checkout) - o navegador é redirecionado
 *      para lá.
 *   3. O Mercado Pago notifica POST /api/pagamentos/mercadopago/webhook de
 *      forma assíncrona quando o pagamento muda de status. O webhook busca
 *      o pagamento real via consultarPagamento() (nunca confia em dados que
 *      viriam só da URL de retorno) e, se aprovado, confirma o agendamento.
 */

const MP_API_BASE = "https://api.mercadopago.com";

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export async function criarPreferenciaPagamento(params: {
  /** Formato "agendamento:<id>" ou "comanda:<id>" - o webhook usa o prefixo para saber o que confirmar. */
  externalReference: string;
  titulo: string;
  valor: number;
  emailComprador?: string;
  baseUrl: string;
  /** Caminho (sem domínio) para onde o cliente volta após pagar, ex: "/pagamento/retorno?agendamento=123". */
  backUrlPath: string;
}) {
  const backUrl = `${params.baseUrl}${params.backUrlPath}`;
  const resp = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: params.titulo,
          quantity: 1,
          currency_id: "BRL",
          unit_price: params.valor,
        },
      ],
      payer: params.emailComprador ? { email: params.emailComprador } : undefined,
      external_reference: params.externalReference,
      back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
      auto_return: "approved",
      notification_url: `${params.baseUrl}/api/pagamentos/mercadopago/webhook`,
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ id: string; init_point: string }>;
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
