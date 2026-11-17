// Textos da imagem do recap que mudam conforme o período escolhido.

import type { Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";
import { formatDateRange, formatSince } from "@/lib/format";
import { parseMonthId, parseYearId } from "@/lib/months";

/** "O álbum do mês", "O álbum da sua vida"... `period` é um período do Last.fm ou um mês "AAAA-MM". */
export function albumHeading(period: string, lang: Locale = "pt"): string {
  const t = DICTS[lang].canvas.albumOf;
  if (parseMonthId(period)) return t.month;
  if (parseYearId(period)) return t.year;
  switch (period) {
    case "overall":
      return t.life;
    case "7day":
      return t.week;
    case "1month":
      return t.month;
    case "12month":
      return t.year;
    default:
      return t.period;
  }
}

/** Rótulo curtinho para o bloco do Mosaico: "OUT 26", "7 DIAS", "TUDO". */
export function shortTag(period: string, lang: Locale = "pt"): string {
  const t = DICTS[lang].periods;
  const month = parseMonthId(period);
  if (month) return `${t.monthsShort[month.month - 1].toUpperCase()} ${String(month.year).slice(2)}`;
  const year = parseYearId(period);
  if (year) return String(year);
  return t.tag[period] ?? "";
}

/** Linha das datas: "desde março de 2019" em "Todo o tempo"; senão, o intervalo. */
export function dateText(period: string, from: number, to: number, timeZone?: string, lang: Locale = "pt"): string {
  return period === "overall" ? formatSince(from, timeZone, lang) : formatDateRange(from, to, timeZone, lang);
}
