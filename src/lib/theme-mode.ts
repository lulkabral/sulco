/**
 * Preferência de tema claro/escuro do site.
 * Por padrão segue o tema do aparelho (`prefers-color-scheme`). Se a pessoa tocar no
 * botão de tema, a escolha ("light" ou "dark") fica salva só no localStorage deste navegador.
 * Funções puras com teste em theme-mode.test.ts.
 */

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "sulco:theme";
export const THEME_EVENT = "sulco-theme-change";

/** Valida um valor lido do localStorage (qualquer coisa inesperada vira null = seguir o aparelho). */
export function parseThemeMode(raw: string | null | undefined): ThemeMode | null {
  return raw === "light" || raw === "dark" ? raw : null;
}

/** Decide qual tema está ativo agora: a escolha salva vence o tema do aparelho. */
export function resolveThemeMode(stored: ThemeMode | null, systemDark: boolean): ThemeMode {
  if (stored) return stored;
  return systemDark ? "dark" : "light";
}

/** Próximo tema ao tocar no botão. */
export function oppositeTheme(current: ThemeMode): ThemeMode {
  return current === "dark" ? "light" : "dark";
}

/**
 * Script inline minúsculo para o <head>: aplica o tema salvo antes da primeira pintura
 * da página, evitando o piscar errado ao abrir no tema escolhido.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
