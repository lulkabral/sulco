"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, localePath, type Locale } from "./config";
import { DICTS } from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Passa a língua da página para os componentes do navegador (fica no layout). */
export function LocaleProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

/** Língua, textos e montador de links da página atual (componentes do navegador). */
export function useI18n() {
  const lang = useContext(LocaleContext);
  return { lang, t: DICTS[lang], href: (path: string) => localePath(lang, path) };
}
