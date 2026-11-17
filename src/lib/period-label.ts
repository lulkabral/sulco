import type { Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";
import { parseMonthId } from "./months";

/**
 * Rótulo curto do período escolhido, para o botão "período ▾":
 * "30 dias", "out 2026", "2025" ou "2026 até agora" (ano corrente).
 */
export function shortPeriodLabel(period: string, currentYear: number, lang: Locale = "pt"): string {
  const t = DICTS[lang].periods;
  if (t.short[period]) return t.short[period];
  const month = parseMonthId(period);
  if (month) return `${t.monthsShort[month.month - 1]} ${month.year}`;
  if (/^\d{4}$/.test(period)) return Number(period) === currentYear ? t.yearOngoing(Number(period)) : period;
  return period;
}
