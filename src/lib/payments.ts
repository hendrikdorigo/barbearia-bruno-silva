/**
 * GATEWAY DE PAGAMENTO MOCK
 * -----------------------------------------------------------------------
 * Este módulo simula um gateway de pagamento com aprovação instantânea.
 * Quando o cliente escolher pagar antecipado, este serviço "processa" o
 * pagamento e retorna aprovado.
 *
 * PARA PLUGAR UM GATEWAY REAL (Mercado Pago / Stripe / PagSeguro):
 * 1. Substitua a função `processarPagamentoMock` por uma chamada real à
 *    API do gateway escolhido (ex: criar um "payment intent"/"preferência").
 * 2. Troque `gateway_referencia` pelo ID retornado pelo gateway real.
 * 3. Trate webhooks de confirmação do gateway para atualizar o status do
 *    registro em `pagamentos` (hoje a aprovação é imediata/mock).
 * 4. Mantenha a mesma assinatura de retorno para não quebrar o restante
 *    do fluxo de agendamento.
 */

export type ResultadoPagamentoMock = {
  aprovado: boolean;
  referencia: string;
};

export async function processarPagamentoMock(
  metodo: "credito" | "debito" | "dinheiro" | "pix",
  valor: number
): Promise<ResultadoPagamentoMock> {
  // Simula latência de rede de um gateway real
  await new Promise((r) => setTimeout(r, 600));

  return {
    aprovado: true,
    referencia: `MOCK-${metodo.toUpperCase()}-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`,
  };
}
