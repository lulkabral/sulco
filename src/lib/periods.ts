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

/** Lê o `?period=` do endereço. Valor ausente ou desconhecido vira o padrão. */
export function parseUiPeriod(raw: string | string[] | undefined): UiPeriod {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const found = UI_PERIODS.find((p) => p.value === value);
  return found ? found.value : DEFAULT_UI_PERIOD;
}

export function periodLabel(period: UiPeriod): string {
  return UI_PERIODS.find((p) => p.value === period)?.label ?? "";
}
