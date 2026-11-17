import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";
// Meses fechados do calendário (SPEC, "Mês fechado").
// No endereço, um mês aparece como "AAAA-MM" (ex.: ?period=2026-10).

/** Quantos meses fechados o seletor oferece. */
export const MONTH_OPTIONS = 12;

export type MonthId = `${number}-${string}`;

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-10" -> { year: 2026, month: 10 }. Formato errado ou ano absurdo -> null. */
export function parseMonthId(raw: string | null | undefined): { year: number; month: number } | null {
  const m = MONTH_RE.exec(raw ?? "");
  if (!m) return null;
  const year = Number(m[1]);
  if (year < 2002 || year > 2100) return null; // o Last.fm começou em 2002
  return { year, month: Number(m[2]) };
}

function toMonthId(year: number, month: number): MonthId {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Os `count` últimos meses já encerrados, do mais recente para o mais antigo.
 * Em 15/11/2026: ["2026-10", "2026-09", ..., "2025-11"].
 * Usa o calendário de `now` em UTC (o servidor não sabe o fuso de quem pede).
 */
export function lastClosedMonths(now: Date, count = MONTH_OPTIONS): MonthId[] {
  const months: MonthId[] = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1; // mês corrente (1 a 12), ainda aberto
  for (let i = 0; i < count; i++) {
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    months.push(toMonthId(year, month));
  }
  return months;
}

/**
 * Todos os meses já encerrados desde o mês de cadastro
 * (`registeredAt`, timestamp UNIX em segundos), do mais recente para o mais antigo.
 * Cadastro desconhecido (0) vira os últimos 12 meses. Calendário em UTC.
 */
export function monthsSince(registeredAt: number, now: Date): MonthId[] {
  if (!registeredAt || registeredAt <= 0) return lastClosedMonths(now);
  const start = new Date(registeredAt * 1000);
  const count =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  return count > 0 ? lastClosedMonths(now, count) : [];
}

/** `monthsSince` de agora. Só para código de servidor que já chamou `connection()`. */
export function currentMonthsSince(registeredAt: number): MonthId[] {
  return monthsSince(registeredAt, new Date());
}

/** "2026-10" -> "Outubro de 2026" ("October 2026", "Octubre de 2026"). */
export function monthLabel(id: string, lang: Locale = "pt"): string {
  const parsed = parseMonthId(id);
  if (!parsed) return "";
  const text = new Intl.DateTimeFormat(INTL_LOCALE[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(parsed.year, parsed.month - 1, 1)),
  );
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

/**
 * Começo e fim do mês em timestamps UNIX (segundos), no fuso do aparelho
 * (é assim que `new Date(ano, mês, dia)` funciona). O fim é o último segundo do mês.
 * Roda no navegador: cada pessoa vê o mês do seu próprio relógio.
 */
export function monthRange(id: string): { from: number; to: number } | null {
  const parsed = parseMonthId(id);
  if (!parsed) return null;
  const start = new Date(parsed.year, parsed.month - 1, 1).getTime();
  const nextStart = new Date(parsed.year, parsed.month, 1).getTime();
  return { from: start / 1000, to: nextStart / 1000 - 1 };
}

// ---------- anos inteiros ----------

const YEAR_RE = /^\d{4}$/;

/** "2025" -> 2025. Formato errado ou ano absurdo -> null. */
export function parseYearId(raw: string | null | undefined): number | null {
  if (!YEAR_RE.test(raw ?? "")) return null;
  const year = Number(raw);
  return year >= 2002 && year <= 2100 ? year : null;
}

/**
 * Anos que dá para escolher: do ano corrente até o ano de cadastro, do mais recente
 * para o mais antigo. Calendário em UTC (o servidor não sabe o fuso de quem pede).
 */
export function yearsSince(registeredAt: number, now: Date): number[] {
  const current = now.getUTCFullYear();
  const first = registeredAt > 0 ? new Date(registeredAt * 1000).getUTCFullYear() : current;
  const years: number[] = [];
  for (let y = current; y >= Math.min(first, current); y--) years.push(y);
  return years;
}

/** `yearsSince` de agora. Só para código de servidor que já chamou `connection()`. */
export function currentYearsSince(registeredAt: number): number[] {
  return yearsSince(registeredAt, new Date());
}

/** Bloco de arredondamento do fim do ano corrente (o mesmo dos períodos: cache funciona). */
const STEP = 600;

/**
 * Começo e fim do ano no fuso do aparelho (timestamps UNIX em segundos).
 * No ano corrente, o fim é "agora" (arredondado em 10 min). Ano futuro: null.
 */
export function yearRange(year: number, nowSeconds: number): { from: number; to: number; ongoing: boolean } | null {
  const from = new Date(year, 0, 1).getTime() / 1000;
  const end = new Date(year + 1, 0, 1).getTime() / 1000 - 1;
  if (from > nowSeconds) return null;
  const now = Math.floor(nowSeconds / STEP) * STEP;
  return end < now ? { from, to: end, ongoing: false } : { from, to: now, ongoing: true };
}

/** "2025" ou, no ano corrente, "2026 até agora" ("2026 so far"). */
export function yearLabel(year: number, ongoing: boolean, lang: Locale = "pt"): string {
  return ongoing ? DICTS[lang].periods.yearOngoing(year) : String(year);
}
