/**
 * Um agendamento pode ser de um cliente cadastrado (clientes/profiles) ou
 * de um cliente avulso, sem conta, reservado manualmente pelo barbeiro
 * (cliente_nome_avulso/cliente_telefone_avulso). Essas funções escondem
 * essa diferença na hora de exibir nome/telefone.
 */
export function nomeClienteAgendamento(a: any): string {
  return a?.clientes?.profiles?.nome ?? a?.cliente_nome_avulso ?? "Cliente avulso";
}

export function telefoneClienteAgendamento(a: any): string | null {
  return a?.clientes?.profiles?.telefone ?? a?.cliente_telefone_avulso ?? null;
}

export function ehClienteAvulso(a: any): boolean {
  return !a?.cliente_id;
}
