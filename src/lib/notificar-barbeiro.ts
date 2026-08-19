import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Avisa o barbeiro (sino de notificações) que um cliente marcou um horário
 * novo. Usa a service role porque quem dispara isso é o cliente, que não
 * tem (e não deveria ter) permissão de RLS para inserir notificação na
 * conta de outra pessoa. Como toda notificação de sistema aqui, falha
 * nunca deve travar o agendamento em si - quem chama deve envolver em
 * try/catch e só logar o erro.
 */
export async function notificarBarbeiroNovoAgendamento(agendamentoId: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;

  const admin = createServiceClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data: agendamento } = await admin
    .from("agendamentos")
    .select("barbeiro_id, data_hora, clientes(profiles(nome)), servicos(nome)")
    .eq("id", agendamentoId)
    .single();

  if (!agendamento) return;

  const dataHora = new Date(agendamento.data_hora).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const nomeCliente = (agendamento as any).clientes?.profiles?.nome ?? "Um cliente";
  const nomeServico = (agendamento as any).servicos?.nome ?? "um atendimento";

  await admin.from("notificacoes").insert({
    profile_id: agendamento.barbeiro_id,
    tipo: "novo_agendamento",
    titulo: "Novo agendamento",
    mensagem: `${nomeCliente} marcou ${nomeServico} para ${dataHora}.`,
    referencia_id: agendamentoId,
  });
}
