import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SP_TZ } from "@/lib/timezone-sp";

/**
 * Avisa o cliente (sino de notificações) que o barbeiro recusou o
 * agendamento dele. Usa o próprio client autenticado de quem chamou (o
 * barbeiro/admin) - a policy de INSERT em notificacoes é aberta
 * (with_check: true), então não precisa de service role aqui. Cliente
 * avulso (sem conta, cliente_id nulo) não tem pra quem notificar.
 * Falha aqui nunca deve travar a troca de status em si - quem chama deve
 * envolver em try/catch e só logar o erro.
 */
export async function notificarClienteAgendamentoRecusado(
  supabase: SupabaseClient<Database>,
  agendamentoId: string
) {
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("cliente_id, data_hora, barbeiros(profiles(nome)), servicos(nome)")
    .eq("id", agendamentoId)
    .single();

  if (!agendamento?.cliente_id) return;

  const dataHora = new Date(agendamento.data_hora).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: SP_TZ,
  });
  const nomeBarbeiro = (agendamento as any).barbeiros?.profiles?.nome ?? "O barbeiro";
  const nomeServico = (agendamento as any).servicos?.nome ?? "seu atendimento";

  await supabase.from("notificacoes").insert({
    profile_id: agendamento.cliente_id,
    tipo: "agendamento_recusado",
    titulo: "Agendamento recusado",
    mensagem: `${nomeBarbeiro} não pôde confirmar ${nomeServico} marcado para ${dataHora}. Escolha outro horário.`,
    referencia_id: agendamentoId,
  });
}
