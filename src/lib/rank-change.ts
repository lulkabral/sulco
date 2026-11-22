// Comparação de posição nos tops (artistas, músicas, álbuns e gêneros)
// em relação ao período anterior. Tudo aqui é puro: nenhuma chamada de rede.

import { genreKey } from "@/lib/genres";
import { monthRange, parseMonthId, parseYearId, yearRange, type MonthId } from "@/lib/months";
import { PERIOD_DAYS, type UiPeriod } from "@/lib/periods";

/** Quantos itens buscar do período anterior nos gráficos (máximo da rota /api/lastfm/chart). */
export const PREV_CHART_LIMIT = 200;

/** Quantos artistas do período anterior entram no cálculo rápido dos gêneros anteriores. */
export const PREV_GENRE_ARTISTS = 10;

/** Quantos gêneros calcular no período anterior (puro em memória, sem chamadas extras de tag.getInfo). */
export const PREV_GENRE_LIMIT = 15;

/** 1/1/2002 (início do Last.fm; mesmo limite de src/lib/lastfm/validate.ts). */
const MIN_TIMESTAMP = 1_009_843_200;

export type RankChange =
  | { status: "up"; delta: number; prevRank: number }
  | { status: "down"; delta: number; prevRank: number }
  | { status: "same"; prevRank: number }
  | { status: "new" };

/** Chave normalizada para comparar nomes (ignora maiúsculas e espaços extras). */
export function rankKey(...parts: string[]): string {
  return parts
    .map((p) => p.trim().toLowerCase().replace(/\s+/g, " "))
    .join("\u0000");
}

/**
 * Compara a lista atual com a lista do período anterior.
 * - Se o período anterior estiver vazio (ex.: conta nova ou pausa total), devolve tudo null
 *   para não marcar todos os itens como "primeira vez" sem base real.
 * - Chaves repetidas na lista anterior mantêm a melhor (menor) posição.
 */
export function computeRankChanges<T, P>(
  current: readonly T[],
  previous: readonly P[],
  keyOfCurrent: (item: T) => string,
  keyOfPrevious: (item: P) => string,
  rankOfCurrent: (item: T, index: number) => number = (_, i) => i + 1,
  rankOfPrevious: (item: P, index: number) => number = (_, i) => i + 1,
): (RankChange | null)[] {
  if (previous.length === 0) return current.map(() => null);

  const prevRanks = new Map<string, number>();
  previous.forEach((item, i) => {
    const key = keyOfPrevious(item);
    if (key && !prevRanks.has(key)) {
      prevRanks.set(key, rankOfPrevious(item, i));
    }
  });

  return current.map((item, i) => {
    const currRank = rankOfCurrent(item, i);
    const prevRank = prevRanks.get(keyOfCurrent(item));
    if (prevRank === undefined) return { status: "new" };
    if (prevRank > currRank) return { status: "up", delta: prevRank - currRank, prevRank };
    if (prevRank < currRank) return { status: "down", delta: currRank - prevRank, prevRank };
    return { status: "same", prevRank };
  });
}

/** Atalho para comparar listas de gêneros usando a normalização oficial (`genreKey`). */
export function computeGenreRankChanges(
  current: readonly { name: string }[],
  previous: readonly { name: string }[],
): (RankChange | null)[] {
  return computeRankChanges(
    current,
    previous,
    (g) => genreKey(g.name),
    (g) => genreKey(g.name),
  );
}

/** Há pelo menos um indicador real na lista (descarta listas vazias ou tudo null)? */
export function hasAnyRankChange(changes: readonly (RankChange | null)[] | null | undefined): boolean {
  return Boolean(changes?.some((c) => c !== null));
}

/**
 * Intervalo imediatamente anterior a um período móvel do Last.fm (`7day`, `1month`, ...).
 * - `overall` não tem período anterior -> `null`.
 * - Se o período anterior terminar antes do cadastro da conta (`registeredAt`), devolve `null`.
 */
export function previousUiPeriodRange(
  period: UiPeriod,
  currentRange: { from: number; to: number },
  registeredAt = 0,
): { from: number; to: number } | null {
  if (period === "overall") return null;
  const span = PERIOD_DAYS[period] * 86_400;
  const to = currentRange.from - 1;
  const from = currentRange.from - span;
  if (from < MIN_TIMESTAMP || to <= from) return null;
  if (registeredAt > 0 && to < registeredAt) return null;
  return { from, to };
}

/** "2026-10" -> "2026-09"; "2026-01" -> "2025-12"; antes de 2002 -> null. */
export function previousMonthId(id: string): MonthId | null {
  const parsed = parseMonthId(id);
  if (!parsed) return null;
  const year = parsed.month === 1 ? parsed.year - 1 : parsed.year;
  const month = parsed.month === 1 ? 12 : parsed.month - 1;
  if (year < 2002) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

export type PreviousHistoryPeriod =
  | { kind: "month"; id: MonthId; range: { from: number; to: number } }
  | { kind: "year"; year: number; range: { from: number; to: number } };

/**
 * Período anterior de um mês fechado (`"AAAA-MM"`) ou ano (`"AAAA"`).
 * Devolve `null` se cair antes de 2002 ou antes do cadastro da conta (`registeredAt`).
 */
export function previousHistoryPeriod(
  period: string,
  nowSeconds: number,
  registeredAt = 0,
): PreviousHistoryPeriod | null {
  const year = parseYearId(period);
  if (year !== null) {
    const prevYear = year - 1;
    if (prevYear < 2002) return null;
    const range = yearRange(prevYear, nowSeconds);
    if (!range || range.from < MIN_TIMESTAMP) return null;
    if (registeredAt > 0 && range.to < registeredAt) return null;
    return { kind: "year", year: prevYear, range: { from: range.from, to: range.to } };
  }

  const prevId = previousMonthId(period);
  if (!prevId) return null;
  const range = monthRange(prevId);
  if (!range || range.from < MIN_TIMESTAMP) return null;
  if (registeredAt > 0 && range.to < registeredAt) return null;
  return { kind: "month", id: prevId, range };
}
