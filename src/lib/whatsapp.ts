/**
 * ADAPTER DE LEMBRETES WHATSAPP
 * -----------------------------------------------------------------------
 * Estrutura pronta para conectar a WhatsApp Business API oficial
 * (Meta Cloud API ou Twilio) assim que as credenciais estiverem
 * disponíveis via variáveis de ambiente:
 *   - WHATSAPP_API_TOKEN
 *   - WHATSAPP_PHONE_NUMBER_ID
 *   - WHATSAPP_PROVIDER ("meta" | "twilio")
 *
 * O fluxo de negócio já está pronto no banco de dados:
 *   - Tabela `lembretes_whatsapp` funciona como fila: cada agendamento
 *     cria automaticamente (via trigger) um registro com
 *     `agendado_para` = data_hora - 1 hora.
 *   - Um worker/cron (ex: Netlify Scheduled Function) deve rodar
 *     periodicamente chamando `enviarLembretesPendentes`, que busca
 *     lembretes com status "agendado" e `agendado_para` <= agora, e usa
 *     este adapter para efetivamente enviar a mensagem.
 *
 * Hoje, sem as credenciais preenchidas, `enviarMensagemWhatsapp` apenas
 * loga a mensagem e marca como "falhou" com um erro explicativo, sem
 * quebrar o restante do sistema.
 */

export type EnvioWhatsappResultado = {
  sucesso: boolean;
  erro?: string;
};

export async function enviarMensagemWhatsapp(
  telefone: string | null,
  mensagem: string
): Promise<EnvioWhatsappResultado> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const provider = process.env.WHATSAPP_PROVIDER ?? "meta";

  if (!token || !phoneId || !telefone) {
    console.warn(
      "[whatsapp] Credenciais nao configuradas (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Mensagem nao enviada:",
      { telefone, mensagem }
    );
    return {
      sucesso: false,
      erro: "Credenciais da WhatsApp Business API nao configuradas ainda.",
    };
  }

  try {
    if (provider === "meta") {
      const resp = await fetch(
        `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: telefone,
            type: "text",
            text: { body: mensagem },
          }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      return { sucesso: true };
    }

    // provider === "twilio" - implementar chamada equivalente aqui quando as
    // credenciais TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN forem configuradas.
    return { sucesso: false, erro: "Provider twilio ainda nao implementado." };
  } catch (e) {
    return { sucesso: false, erro: String(e) };
  }
}
