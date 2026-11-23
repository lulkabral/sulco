"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { LANG_COOKIE, LOCALE_NAMES, LOCALES, localePath, stripLocale, type Locale } from "@/i18n/config";

/** Um ano, em segundos. */
const ONE_YEAR = 31_536_000;

/** Guarda a língua escolhida (só "pt", "en" ou "es") para o proxy abrir o site nela. */
function rememberLocale(target: Locale) {
  document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/**
 * Seletor compacto de idioma (ícone de globo no mesmo tamanho do botão de tema).
 * Ao clicar, abre um menu limpo com Português, English e Español; guarda a escolha
 * num cookie só com a língua (src/proxy.ts) e recarrega a mesma página na outra língua.
 */
export function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(event: React.MouseEvent<HTMLAnchorElement>, target: Locale) {
    event.preventDefault();
    setOpen(false);
    if (target === lang) return;
    rememberLocale(target);
    // A mesma página (e o mesmo período) na outra língua. O endereço é lido só no clique:
    // ler antes impediria o Next de preparar a página com antecedência.
    const { pathname, search } = window.location;
    // Recarrega inteira: muda o <html lang> e os textos do servidor.
    window.location.assign(localePath(target, stripLocale(pathname)) + search);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.footer.language}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        title={`${t.footer.language} (${LOCALE_NAMES[lang]})`}
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink transition duration-200 ease-smooth hover:bg-card-2 active:scale-[0.96]"
      >
        <GlobeIcon />
      </button>

      {open && (
        <nav
          id={menuId}
          aria-label={t.footer.language}
          className="absolute right-0 top-full z-40 mt-2 w-40 rounded-2xl border border-line bg-card p-1.5 shadow-lg shadow-black/20"
        >
          <ul className="flex flex-col gap-0.5">
            {LOCALES.map((l) => {
              const active = l === lang;
              return (
                <li key={l}>
                  <a
                    // Sem JavaScript, leva ao início na língua escolhida.
                    href={localePath(l, "/")}
                    hrefLang={l}
                    lang={l}
                    aria-current={active ? "true" : undefined}
                    onClick={(e) => choose(e, l)}
                    className={
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150 " +
                      (active
                        ? "bg-card-2 text-ink"
                        : "text-soft hover:bg-card-2/70 hover:text-ink")
                    }
                  >
                    <span>{LOCALE_NAMES[l]}</span>
                    {active ? (
                      <CheckIcon />
                    ) : (
                      <span className="text-[11px] font-medium uppercase text-ink-faint">{l}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-terra-text"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}
