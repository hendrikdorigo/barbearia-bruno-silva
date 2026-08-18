export const SP_TZ = "America/Sao_Paulo";

/** Data (YYYY-MM-DD) de um timestamp ISO, no horário de Brasília. */
export function paraDataSP(dataHoraIso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SP_TZ }).format(new Date(dataHoraIso));
}

/** Hora (HH:MM) de um timestamp ISO, no horário de Brasília. */
export function paraHoraSP(dataHoraIso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(dataHoraIso));
}

/** Soma (ou subtrai) dias a uma data YYYY-MM-DD, sem depender de fuso local. */
export function somaDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
