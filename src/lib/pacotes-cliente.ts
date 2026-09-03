export const DIAS_SEMANA_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type PacoteCliente = {
  id: string;
  nome: string;
  dias_semana: number[] | null;
  observacoes: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  valor_total: number | null;
  qtd_visitas_incluidas: number | null;
  visitas_usadas: number;
};

/** Se o pacote está dentro da janela de validade (ativo e dentro de data_inicio/data_fim, se houver). */
export function pacoteVigente(p: Pick<PacoteCliente, "ativo" | "data_inicio" | "data_fim">): boolean {
  if (!p.ativo) return false;
  const hoje = new Date().toISOString().slice(0, 10);
  if (p.data_inicio && hoje < p.data_inicio) return false;
  if (p.data_fim && hoje > p.data_fim) return false;
  return true;
}

/** Texto curto pros dias válidos, ex: "Seg, Ter, Qua" ou "Todos os dias". */
export function textoDiasSemana(dias: number[] | null): string {
  if (!dias || dias.length === 0 || dias.length === 7) return "Todos os dias";
  return [...dias].sort().map((d) => DIAS_SEMANA_ABREV[d]).join(", ");
}

/** Se o pacote tem valor/quantidade configurados pra gerar agendamentos com valor rateado automaticamente. */
export function pacoteTemRateio(
  p: Pick<PacoteCliente, "valor_total" | "qtd_visitas_incluidas">
): boolean {
  return p.valor_total != null && p.qtd_visitas_incluidas != null && p.qtd_visitas_incluidas > 0;
}

/** Valor de cada visita, arredondado - só faz sentido se pacoteTemRateio(p). */
export function valorPorVisita(p: Pick<PacoteCliente, "valor_total" | "qtd_visitas_incluidas">): number {
  if (!pacoteTemRateio(p)) return 0;
  return Math.round((Number(p.valor_total) / Number(p.qtd_visitas_incluidas)) * 100) / 100;
}

/** Se ainda sobra visita nesse pacote (só relevante quando pacoteTemRateio(p)). */
export function pacoteTemVisitaDisponivel(
  p: Pick<PacoteCliente, "qtd_visitas_incluidas" | "visitas_usadas">
): boolean {
  if (p.qtd_visitas_incluidas == null) return false;
  return p.visitas_usadas < p.qtd_visitas_incluidas;
}

/** Se esse pacote pode ser usado automaticamente numa data específica (vigente, com rateio, com visita sobrando e dia da semana batendo). */
export function pacoteUsavelNaData(p: PacoteCliente, dataISO: string): boolean {
  if (!pacoteVigente(p) || !pacoteTemRateio(p) || !pacoteTemVisitaDisponivel(p)) return false;
  if (!p.dias_semana || p.dias_semana.length === 0) return true;
  const diaSemana = new Date(`${dataISO}T00:00:00`).getDay();
  return p.dias_semana.includes(diaSemana);
}
