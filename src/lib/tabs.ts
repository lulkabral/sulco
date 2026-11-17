import { localePath, type Locale } from "@/i18n/config";

/** Abas da página do usuário (os nomes mostrados ficam no dicionário: profile.tabs). */
export const TABS = [
  { value: "recap", label: "Recap" },
  { value: "grade", label: "Grade" },
] as const;

export type Tab = (typeof TABS)[number]["value"];

/** Lê o `?tab=` do endereço. Valor ausente ou desconhecido vira "recap". */
export function parseTab(raw: string | string[] | undefined): Tab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return TABS.find((t) => t.value === value)?.value ?? "recap";
}

/**
 * Monta o endereço da página do usuário. Só põe no endereço o que difere do padrão,
 * para não "fixar" um período que a pessoa não escolheu.
 */
export function userPageHref(username: string, tab: Tab, period?: string, lang: Locale = "pt"): string {
  const params = new URLSearchParams();
  if (tab !== "recap") params.set("tab", tab);
  if (period) params.set("period", period);
  const query = params.toString();
  return localePath(lang, `/u/${encodeURIComponent(username)}${query ? `?${query}` : ""}`);
}
