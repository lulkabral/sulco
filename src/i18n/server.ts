import "server-only";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "./config";
import { DICTS } from "./index";

/** Língua da página atual (o `[lang]` do endereço), em qualquer componente do servidor. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Língua, textos e montador de links da página atual (componentes do servidor). */
export async function getI18n() {
  const locale = await getLocale();
  return { lang: locale, t: DICTS[locale], href: (path: string) => localePath(locale, path) };
}
