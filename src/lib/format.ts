import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";

/** 69921 -> "69.921" (pt, es) ou "69,921" (en). */
export function formatNumber(n: number, lang: Locale = "pt"): string {
  return new Intl.NumberFormat(INTL_LOCALE[lang]).format(n);
}

/** 1 -> "1 reprodução", 25 -> "25 reproduções" ("25 plays", "25 reproducciones"). */
export function formatPlays(n: number, lang: Locale = "pt"): string {
  return DICTS[lang].units.plays(formatNumber(n, lang), n);
}

/** Ano (em UTC) de um timestamp UNIX em segundos. 0 ou inválido -> null. */
export function yearOf(unixSeconds: number): number | null {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return null;
  return new Date(unixSeconds * 1000).getUTCFullYear();
}

function dateParts(unixSeconds: number, lang: Locale, timeZone?: string) {
  const date = new Date(unixSeconds * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = Number(get("month"));
  return { day: String(Number(get("day"))), month, year: get("year"), monthName: DICTS[lang].periods.monthsShort[month - 1] };
}

/**
 * Intervalo de datas curto, no fuso do aparelho (ou no `timeZone` dado).
 * Exemplos: "8 – 15 nov 2026", "16 out – 15 nov 2026", "15 nov 2025 – 15 nov 2026".
 * (Em inglês: "16 Oct – 15 Nov 2026".)
 */
export function formatDateRange(fromSeconds: number, toSeconds: number, timeZone?: string, lang: Locale = "pt"): string {
  const a = dateParts(fromSeconds, lang, timeZone);
  const b = dateParts(toSeconds, lang, timeZone);
  const end = `${b.day} ${b.monthName} ${b.year}`;
  if (a.year !== b.year) return `${a.day} ${a.monthName} ${a.year} – ${end}`;
  if (a.month !== b.month) return `${a.day} ${a.monthName} – ${end}`;
  return `${a.day} – ${end}`;
}

/** "desde março de 2019" / "since March 2019" (no fuso do aparelho, ou no `timeZone` dado). */
export function formatSince(unixSeconds: number, timeZone?: string, lang: Locale = "pt"): string {
  const text = new Intl.DateTimeFormat(INTL_LOCALE[lang], { month: "long", year: "numeric", timeZone }).format(
    new Date(unixSeconds * 1000),
  );
  return DICTS[lang].periods.since(text);
}
