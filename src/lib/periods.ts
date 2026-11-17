import type { Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";
import type { Period } from "@/lib/lastfm/types";

/** Períodos que aparecem no seletor da tela, na ordem em que aparecem. */
export const UI_PERIODS = [
  { value: "overall", label: "Todo o tempo" },
  { value: "7day", label: "Últimos 7 dias" },
  { value: "1month", label: "Últimos 30 dias" },
  { value: "3month", label: "Últimos 3 meses" },
  { value: "6month", label: "Últimos 6 meses" },
  { value: "12month", label: "Últimos 12 meses" },
] as const satisfies readonly { value: Period; label: string }[];

export type UiPeriod = (typeof UI_PERIODS)[number]["value"];

export const DEFAULT_UI_PERIOD: UiPeriod = "1month";

/** Período padrão da aba Grade: a "semaninha" (ver SPEC, Recurso 2). */
export const DEFAULT_GRID_PERIOD: UiPeriod = "7day";

/** Lê o `?period=` do endereço. Valor ausente ou desconhecido vira `fallback`. */
export function parseUiPeriod(
  raw: string | string[] | undefined,
  fallback: UiPeriod = DEFAULT_UI_PERIOD,
): UiPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const found = UI_PERIODS.find((p) => p.value === value);
  return found ? found.value : fallback;
}

/** Nome do período na língua: "Últimos 30 dias", "Last 30 days". */
export function periodLabel(period: UiPeriod, lang: Locale = "pt"): string {
  return DICTS[lang].periods.long[period] ?? "";
}

/**
 * Quantos dias o Last.fm conta em cada período (testado em 15/11/2026: com esses valores,
 * o total de `user.getRecentTracks` bate com a soma dos plays de `user.getTopArtists`).
 */
export const PERIOD_DAYS: Record<Exclude<UiPeriod, "overall">, number> = {
  "7day": 7,
  "1month": 30,
  "3month": 90,
  "6month": 180,
  "12month": 365,
};

/** Tamanho do bloco de arredondamento do `to`, em segundos (para o cache funcionar). */
export const RANGE_STEP_SECONDS = 600;

/**
 * Intervalo (timestamps UNIX em segundos) que corresponde ao período, terminando "agora".
 * O fim é arredondado para baixo em blocos de 10 min: chamadas no mesmo bloco
 * usam os mesmos parâmetros e aproveitam o cache.
 * "Todo o tempo" começa no cadastro da pessoa (`registeredAt`).
 */
export function periodRange(
  period: UiPeriod,
  nowSeconds: number,
  registeredAt = 0,
): { from: number; to: number } {
  const to = Math.floor(nowSeconds / RANGE_STEP_SECONDS) * RANGE_STEP_SECONDS;
  if (period === "overall") return { from: registeredAt, to };
  return { from: to - PERIOD_DAYS[period] * 86_400, to };
}

/** `periodRange` terminando agora. Só para código de servidor que já chamou `connection()`. */
export function currentPeriodRange(period: UiPeriod, registeredAt = 0): { from: number; to: number } {
  return periodRange(period, Date.now() / 1000, registeredAt);
}
