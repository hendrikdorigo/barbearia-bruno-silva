import { paraDataSP, SP_TZ } from "@/lib/timezone-sp";

/** Mês atual (YYYY-MM) no horário de Brasília. */
export function mesAtualSP(): string {
  return paraDataSP(new Date().toISOString()).slice(0, 7);
}

/** Início e fim (exclusivo) de um mês (YYYY-MM), em ISO com -03:00 explícito
 * - mesmo motivo do resto do app: sem o offset o Postgres trataria a string
 * como se já fosse UTC. Brasília não tem horário de verão desde 2019, então
 * -03:00 é sempre correto. */
export function limitesMes(mes: string): { inicioISO: string; fimISO: string } {
  const [ano, mesNum] = mes.split("-").map(Number);
  const inicioISO = `${mes}-01T00:00:00-03:00`;
  const proximoMes = mesNum === 12 ? `${ano + 1}-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}`;
  const fimISO = `${proximoMes}-01T00:00:00-03:00`;
  return { inicioISO, fimISO };
}

/** Mês anterior/seguinte a um mês YYYY-MM, sem depender de fuso local. */
export function mesAnterior(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  return mesNum === 1 ? `${ano - 1}-12` : `${ano}-${String(mesNum - 1).padStart(2, "0")}`;
}
export function mesSeguinte(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  return mesNum === 12 ? `${ano + 1}-01` : `${ano}-${String(mesNum + 1).padStart(2, "0")}`;
}

/** "Setembro de 2026" a partir de "2026-09". */
export function formatarMes(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  const nome = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: SP_TZ }).format(
    new Date(Date.UTC(ano, mesNum - 1, 15))
  );
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** Lista de meses (mais recente primeiro) do mais antigo com dado até o atual. */
export function listaMeses(maisAntigo: string, maisRecente: string): string[] {
  const meses: string[] = [];
  let atual = maisRecente;
  // limite de segurança pra nunca travar num loop infinito por dado corrompido
  for (let i = 0; i < 600 && atual >= maisAntigo; i++) {
    meses.push(atual);
    atual = mesAnterior(atual);
  }
  return meses;
}

export type AgendamentoFinanceiro = {
  valor_servico: number;
  valor_repasse_bruno: number;
  barbeiros?: { is_dono: boolean } | null;
  comandas?: { valor_produtos: number; valor_debito_no_show: number; valor_repasse_produtos: number } | null;
};

export type ResumoFinanceiro = {
  faturamento: number;
  comissoes: number;
  despesas: number;
  salario: number;
  lucro: number;
};

/**
 * Faturamento: mesma definição usada nos cards de estatística do painel
 * (serviço + produtos + eventual débito de no-show cobrado junto).
 * Comissões: o quanto do faturamento vira repasse pros barbeiros parceiros
 * (não conta o Bruno/dono, que fica com 100% do próprio atendimento).
 * Salário: quanto o próprio Bruno já retirou de pró-labore no mês.
 * Lucro: faturamento - comissões - despesas - salário retirado no mês
 * (o que sobra de fato dentro do caixa da barbearia).
 */
export function calcularResumoFinanceiro(
  agendamentos: AgendamentoFinanceiro[],
  despesasDoMes: { valor: number }[],
  retiradasDoMes: { valor: number }[] = []
): ResumoFinanceiro {
  let faturamento = 0;
  let comissoes = 0;
  for (const a of agendamentos) {
    faturamento +=
      Number(a.valor_servico) +
      Number(a.comandas?.valor_produtos ?? 0) +
      Number(a.comandas?.valor_debito_no_show ?? 0);
    if (!a.barbeiros?.is_dono) {
      comissoes += Number(a.valor_servico) - Number(a.valor_repasse_bruno);
      comissoes += Number(a.comandas?.valor_repasse_produtos ?? 0);
    }
  }
  const despesas = despesasDoMes.reduce((acc, d) => acc + Number(d.valor), 0);
  const salario = retiradasDoMes.reduce((acc, r) => acc + Number(r.valor), 0);
  return { faturamento, comissoes, despesas, salario, lucro: faturamento - comissoes - despesas - salario };
}
