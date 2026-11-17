import { parseMonthId } from "./months";

/** Rótulos curtos dos períodos do Last.fm (cabem num botão). */
export const PERIOD_SHORT: Record<string, string> = {
  overall: "Todo o tempo",
  "7day": "7 dias",
  "1month": "30 dias",
  "3month": "3 meses",
  "6month": "6 meses",
  "12month": "12 meses",
};

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Rótulo curto do período escolhido, para o botão "período ▾":
 * "30 dias", "out 2026", "2025" ou "2026 até agora" (ano corrente).
 */
export function shortPeriodLabel(period: string, currentYear: number): string {
  if (PERIOD_SHORT[period]) return PERIOD_SHORT[period];
  const month = parseMonthId(period);
  if (month) return `${MONTHS[month.month - 1]} ${month.year}`;
  if (/^\d{4}$/.test(period)) return Number(period) === currentYear ? `${period} até agora` : period;
  return period;
}
