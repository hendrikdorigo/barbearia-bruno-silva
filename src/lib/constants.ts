export const SLOT_START = "09:00";
export const SLOT_END = "19:30";
export const SLOT_STEP_MINUTES = 30;
export const TOLERANCIA_ATRASO_MINUTOS = 15;

/** Gera os horarios de 30 em 30 min entre 09:00 e 19:30 (inclusive) — janela padrão global */
export function gerarSlotsDia(): string[] {
  return gerarSlots(SLOT_START, SLOT_END);
}

/** Gera slots de 30 em 30 min entre um início e fim customizados (ex: horário próprio do barbeiro) */
export function gerarSlots(inicio: string, fim: string): string[] {
  const slots: string[] = [];
  let [h, m] = inicio.slice(0, 5).split(":").map(Number);
  const [endH, endM] = fim.slice(0, 5).split(":").map(Number);
  while (h < endH || (h === endH && m <= endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += SLOT_STEP_MINUTES;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return slots;
}

/** Verifica se um slot (HH:MM) cai dentro de algum bloqueio (almoço, compromisso etc). */
export function slotBloqueado(
  slot: string,
  bloqueios: { hora_inicio: string; hora_fim: string }[]
): boolean {
  return bloqueios.some(
    (b) => slot >= b.hora_inicio.slice(0, 5) && slot < b.hora_fim.slice(0, 5)
  );
}

export const FORMAS_PAGAMENTO = [
  { id: "credito", label: "Cartão de Crédito" },
  { id: "debito", label: "Cartão de Débito" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "Pix" },
] as const;
