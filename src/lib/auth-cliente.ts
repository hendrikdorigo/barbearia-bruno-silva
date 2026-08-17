import { createHmac } from "crypto";

/**
 * Login de cliente é só CPF (sem senha), mas o Supabase Auth exige e-mail +
 * senha. Resolvemos isso mapeando o CPF para um e-mail sintético (nunca
 * usado para enviar nada) e derivando a "senha" real via HMAC do CPF com um
 * segredo que só existe no servidor - o navegador nunca vê nem a senha nem
 * o segredo, só manda o CPF. Isso roda inteiramente em rotas de servidor.
 */
export function emailSinteticoCPF(cpfDigits: string): string {
  return `cpf.${cpfDigits}@clientes.barbearia-brunosilva.internal`;
}

export function senhaDerivadaCPF(cpfDigits: string): string {
  const segredo = process.env.CPF_LOGIN_SECRET;
  if (!segredo) {
    throw new Error("CPF_LOGIN_SECRET não configurado no servidor.");
  }
  return createHmac("sha256", segredo).update(cpfDigits).digest("hex");
}
