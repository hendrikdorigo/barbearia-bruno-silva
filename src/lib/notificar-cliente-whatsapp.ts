import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { enviarMensagemWhatsapp } from "@/lib/whatsapp";

export type TipoNotificacaoCliente = "confirmado" | "cancelado" | "no_show";

/**
 * Avisa o cliente por WhatsApp quando o barbeiro/admin muda o status do
 * agendamento dele (confirma, recusa/cancela, ou marca que ele não veio).
 * Sem WHATSAPP_API_TOKEN/WHATSAPP_PHONE_NUMBER_ID configurados (chip ainda
 * não comprado), enviarMensagemWhatsapp só loga e retorna sucesso:false -
 * não quebra nada, passa a funcionar sozinho assim que as credenciais
 * forem preenchidas. Quem chama deve envolver em try/catch e só logar erro.
 */
export async function notificarClienteStatusAgendamento(
  agendamentoId: string,
  tipo: TipoNotificacaoCliente
) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: agendamento } = await admin
    .from("agendamentos")
    .select(
      "data_hora, clientes(profiles(nome, telefone)), barbeiros(profiles(nome)), servicos(nome)"
    )
    .eq("id", agendamentoId)
    .single();

  if (!agendamento) return;

  const telefone = (agendamento as any).clientes?.profiles?.telefone ?? null;
  const nomeCliente = (agendamento as any).clientes?.profiles?.nome ?? "Cliente";
  const nomeBarbeiro = (agendamento as any).barbeiros?.profiles?.nome ?? "o barbeiro";
  const nomeServico = (agendamento as any).servicos?.nome ?? "seu atendimento";
  const dataHora = new Date(agendamento.data_hora).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const mensagens: Record<TipoNotificacaoCliente, string> = {
    confirmado: `Oi, ${nomeCliente}! Seu horário de ${nomeServico} com ${nomeBarbeiro} em ${dataHora} foi confirmado. Te esperamos!`,
    cancelado: `Oi, ${nomeCliente}. Seu horário de ${nomeServico} com ${nomeBarbeiro} em ${dataHora} foi cancelado. Se quiser, agende outro horário quando puder.`,
    no_show: `Oi, ${nomeCliente}. Registramos que você não compareceu ao horário de ${nomeServico} com ${nomeBarbeiro} em ${dataHora}. Sua próxima marcação vai exigir pagamento antecipado.`,
  };

  await enviarMensagemWhatsapp(telefone, mensagens[tipo]);
}
