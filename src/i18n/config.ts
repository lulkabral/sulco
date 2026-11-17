// Línguas do site. Português fica sem prefixo no endereço (sulcofm.vercel.app/...);
// inglês e espanhol ganham /en e /es. Funções puras, com teste em config.test.ts.

export const LOCALES = ["pt", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

/** Cookie com a língua escolhida no seletor do rodapé. Só guarda "pt", "en" ou "es": não identifica ninguém. */
export const LANG_COOKIE = "lang";

/** Formato de datas e números de cada língua (Intl). */
export const INTL_LOCALE: Record<Locale, string> = { pt: "pt-BR", en: "en-US", es: "es" };

/** Atributo `lang` do <html> e `og:locale`. */
export const HTML_LANG: Record<Locale, string> = { pt: "pt-BR", en: "en", es: "es" };
export const OG_LOCALE: Record<Locale, string> = { pt: "pt_BR", en: "en_US", es: "es_ES" };

/** Nome de cada língua nela mesma (seletor do rodapé). */
export const LOCALE_NAMES: Record<Locale, string> = { pt: "Português", en: "English", es: "Español" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Caminho na língua: `localePath("en", "/u/ana")` -> "/en/u/ana"; em português fica igual. */
export function localePath(lang: Locale, path: string): string {
  if (lang === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Tira o prefixo de língua do caminho: "/en/u/ana" -> "/u/ana"; "/es" -> "/". */
export function stripLocale(path: string): string {
  const match = /^\/(pt|en|es)(?=\/|$)/.exec(path);
  if (!match) return path;
  return path.slice(match[0].length) || "/";
}

/**
 * Língua preferida pelo cabeçalho Accept-Language do navegador ("es-AR,es;q=0.9,en;q=0.8").
 * Vale a primeira, em ordem de preferência, que o site tem. Nenhuma: null.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const prefs = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => /^\s*q=([\d.]+)/.exec(p)?.[1]).find(Boolean);
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q) : 1, index };
    })
    .filter((p) => p.lang && p.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return prefs.map((p) => p.lang).find(isLocale) ?? null;
}

/** Robôs que montam a prévia de links (X, WhatsApp...) e buscadores: nunca são redirecionados. */
const BOT_RE = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|telegram|embedly|vercel/i;

/**
 * Para onde mandar quem abriu um endereço sem prefixo (que é o português).
 * - Escolheu no seletor (cookie): vale a escolha.
 * - Não escolheu: vale a língua do navegador.
 * - Robôs e quem não manda Accept-Language: ficam no português (a prévia do link no X
 *   não pode mudar de língua conforme o servidor do X).
 * Devolve a língua para redirecionar, ou null para ficar.
 */
export function redirectLocale(input: {
  cookie: string | undefined;
  acceptLanguage: string | null;
  userAgent: string | null;
}): Locale | null {
  const chosen = isLocale(input.cookie) ? input.cookie : null;
  if (chosen) return chosen === DEFAULT_LOCALE ? null : chosen;
  if (!input.userAgent || BOT_RE.test(input.userAgent)) return null;
  const preferred = pickLocale(input.acceptLanguage);
  return preferred && preferred !== DEFAULT_LOCALE ? preferred : null;
}
