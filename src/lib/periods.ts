import type { Period } from "@/lib/lastfm/types";

/** Períodos que aparecem no seletor da tela, na ordem em que aparecem. */
export const UI_PERIODS = [
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

export function periodLabel(period: UiPeriod): string {
  return UI_PERIODS.find((p) => p.value === period)?.label ?? "";
}
