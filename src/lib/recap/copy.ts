// Textos da imagem do recap que mudam conforme o período escolhido.

import { formatDateRange, formatSince } from "@/lib/format";
import { parseMonthId, parseYearId } from "@/lib/months";

const MONTH_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** "O álbum do mês", "O álbum da sua vida"... `period` é um período do Last.fm ou um mês "AAAA-MM". */
export function albumHeading(period: string): string {
  if (parseMonthId(period)) return "O álbum do mês";
  if (parseYearId(period)) return "O álbum do ano";
  switch (period) {
    case "overall":
      return "O álbum da sua vida";
    case "7day":
      return "O álbum da semana";
    case "1month":
      return "O álbum do mês";
    case "12month":
      return "O álbum do ano";
    default:
      return "O álbum do período";
  }
}

/** Rótulo curtinho para o bloco do Mosaico: "OUT 26", "7 DIAS", "TUDO". */
export function shortTag(period: string): string {
  const month = parseMonthId(period);
  if (month) return `${MONTH_SHORT[month.month - 1]} ${String(month.year).slice(2)}`;
  const year = parseYearId(period);
  if (year) return String(year);
  const tags: Record<string, string> = {
    overall: "TUDO",
    "7day": "7 DIAS",
    "1month": "30 DIAS",
    "3month": "3 MESES",
    "6month": "6 MESES",
    "12month": "1 ANO",
  };
  return tags[period] ?? "";
}

/** Linha das datas: "desde março de 2019" em "Todo o tempo"; senão, o intervalo. */
export function dateText(period: string, from: number, to: number, timeZone?: string): string {
  return period === "overall" ? formatSince(from, timeZone) : formatDateRange(from, to, timeZone);
}
