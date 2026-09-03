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
