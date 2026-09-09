/**
 * Mensagem amigável pro erro de criar um agendamento. Prioriza detectar a
 * violação da constraint única (barbeiro_id, data_hora) - dois clientes
 * tentando o mesmo horário ao mesmo tempo - em vez de vazar o erro cru do
 * Postgres ("duplicate key value violates unique constraint...") pra tela.
 */
export function mensagemErroAgendamento(error: { code?: string; message?: string } | null | undefined): string {
  if (error?.code === "23505") {
    return "Esse horário acabou de ser reservado por outra pessoa enquanto você preenchia. Escolha outro horário.";
  }
  return (
    error?.message ||
    "Não foi possível reservar. Talvez esse horário já tenha sido ocupado - escolha outro."
  );
}
