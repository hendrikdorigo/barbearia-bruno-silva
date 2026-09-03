import { paraDataSP, somaDias } from "@/lib/timezone-sp";

export type PeriodoStats = { atendimentos: number; faturamento: number };
export type EstatisticasPeriodo = { hoje: PeriodoStats; semana: PeriodoStats; mes: PeriodoStats };

/**
 * Conta atendimentos (confirmado/concluido) e faturamento de hoje, desta
 * semana (seg-dom) e deste mes, sempre no horario de Brasilia -
 * independente do fuso onde o servidor roda (Vercel roda em UTC).
 * Faturamento inclui o valor do serviço + produtos da loja levados naquele
 * atendimento (comandas.valor_produtos) + eventual débito de não
 * comparecimento de um agendamento anterior cobrado junto (comandas.
 * valor_debito_no_show).
 */
export function calcularEstatisticas(
  agendamentos: {
    data_hora: string;
    valor_servico: number;
    status: string;
    comandas?: { valor_produtos: number; valor_debito_no_show?: number } | null;
  }[]
): EstatisticasPeriodo {
  const hoje = paraDataSP(new Date().toISOString());
  const diaSemana = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0=domingo
  const inicioSemana = somaDias(hoje, diaSemana === 0 ? -6 : 1 - diaSemana);
  const fimSemana = somaDias(inicioSemana, 6);
  const prefixoMes = hoje.slice(0, 7);

  const vazio = (): PeriodoStats => ({ atendimentos: 0, faturamento: 0 });
  const stats: EstatisticasPeriodo = { hoje: vazio(), semana: vazio(), mes: vazio() };

  for (const a of agendamentos) {
    if (a.status !== "confirmado" && a.status !== "concluido") continue;
    const dataAgendamento = paraDataSP(a.data_hora);
    const valor =
      Number(a.valor_servico) +
      Number(a.comandas?.valor_produtos ?? 0) +
      Number(a.comandas?.valor_debito_no_show ?? 0);

    if (dataAgendamento.slice(0, 7) === prefixoMes) {
      stats.mes.atendimentos += 1;
      stats.mes.faturamento += valor;
    }
    if (dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana) {
      stats.semana.atendimentos += 1;
      stats.semana.faturamento += valor;
    }
    if (dataAgendamento === hoje) {
      stats.hoje.atendimentos += 1;
      stats.hoje.faturamento += valor;
    }
  }
  return stats;
}
