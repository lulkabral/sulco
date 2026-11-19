"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";
import {
  oppositeTheme,
  parseThemeMode,
  resolveThemeMode,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme-mode";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

function readMode(): ThemeMode {
  let stored: ThemeMode | null = null;
  try {
    stored = parseThemeMode(document.documentElement.dataset.theme ?? localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    stored = parseThemeMode(document.documentElement.dataset.theme);
  }
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return resolveThemeMode(stored, systemDark);
}

let themeTransitionTimer: number | undefined;

/**
 * Botão claro/escuro no topo das páginas. Por padrão segue o aparelho; ao tocar,
 * alterna imediatamente com transição suave e guarda a escolha só neste navegador (localStorage).
 */
export function ThemeToggle() {
  const { t } = useI18n();
  const mode = useSyncExternalStore<ThemeMode | null>(subscribe, readMode, () => null);

  function toggle() {
    const current = readMode();
    const next = oppositeTheme(current);
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Navegação privada ou armazenamento bloqueado: vale só durante esta visita.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
    window.clearTimeout(themeTransitionTimer);
    themeTransitionTimer = window.setTimeout(() => root.classList.remove("theme-transition"), 280);
  }

  const label = mode === "dark" ? t.common.switchToLight : t.common.switchToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink transition duration-200 ease-smooth hover:bg-card-2 active:scale-[0.96]"
    >
      {mode === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}
