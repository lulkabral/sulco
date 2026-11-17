"use client";

import { useI18n } from "@/i18n/client";
import { LANG_COOKIE, LOCALE_NAMES, LOCALES, localePath, stripLocale, type Locale } from "@/i18n/config";

/** Um ano, em segundos. */
const ONE_YEAR = 31_536_000;

/** Guarda a língua escolhida (só "pt", "en" ou "es") para o proxy abrir o site nela. */
function rememberLocale(target: Locale) {
  document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/**
 * "PT · EN · ES" no rodapé. Guarda a escolha num cookie só com a língua (para o site
 * abrir nela da próxima vez: src/proxy.ts) e abre a mesma página na outra língua.
 */
export function LanguageSwitcher() {
  const { lang, t } = useI18n();

  function choose(event: React.MouseEvent<HTMLAnchorElement>, target: Locale) {
    event.preventDefault();
    rememberLocale(target);
    // A mesma página (e o mesmo período) na outra língua. O endereço é lido só no clique:
    // ler antes impediria o Next de preparar a página com antecedência.
    const { pathname, search } = window.location;
    // Recarrega inteira: muda o <html lang> e os textos do servidor.
    window.location.assign(localePath(target, stripLocale(pathname)) + search);
  }

  return (
    <nav aria-label={t.footer.language} className="flex items-center gap-1 text-xs">
      {LOCALES.map((l) => (
        <a
          key={l}
          // Sem JavaScript, leva ao início na língua escolhida.
          href={localePath(l, "/")}
          hrefLang={l}
          lang={l}
          title={LOCALE_NAMES[l]}
          aria-current={l === lang ? "true" : undefined}
          onClick={(e) => choose(e, l)}
          className={
            "rounded-full px-2.5 py-1 font-bold uppercase tracking-wider transition " +
            (l === lang ? "bg-amber text-amber-ink" : "text-ink-faint hover:text-ink")
          }
        >
          {l}
        </a>
      ))}
    </nav>
  );
}
