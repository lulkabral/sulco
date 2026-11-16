// Escolhas da pessoa para a imagem (formato, cor, números), guardadas só no navegador
// dela (localStorage). Não é cookie e nunca vai para o servidor.

import { DEFAULT_LAYOUT, isLayoutId, type RecapLayoutId } from "./draw";
import { COVER_PALETTE_ID, DEFAULT_PALETTE_ID, PALETTES } from "./palettes";

export type RecapPrefs = {
  layout: RecapLayoutId;
  paletteId: string;
  showNumbers: boolean;
};

export const DEFAULT_PREFS: RecapPrefs = {
  layout: DEFAULT_LAYOUT,
  paletteId: DEFAULT_PALETTE_ID,
  showNumbers: false,
};

const KEY = "recap-prefs";
const EVENT = "recap-prefs-change";

/**
 * Lê as escolhas a partir do texto guardado. Qualquer coisa estranha volta ao padrão.
 * Pura (recebe o texto), para dar para testar.
 */
export function parsePrefs(raw: string | null): RecapPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const data = JSON.parse(raw) as Partial<Record<keyof RecapPrefs, unknown>>;
    const validPalette =
      data.paletteId === COVER_PALETTE_ID || PALETTES.some((p) => p.id === data.paletteId);
    return {
      layout: isLayoutId(data.layout) ? data.layout : DEFAULT_PREFS.layout,
      paletteId: validPalette ? (data.paletteId as string) : DEFAULT_PREFS.paletteId,
      showNumbers: typeof data.showNumbers === "boolean" ? data.showNumbers : DEFAULT_PREFS.showNumbers,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Texto guardado (ou null). O navegador pode bloquear o acesso: aí, null. */
export function readPrefsRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function savePrefs(prefs: RecapPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a escolha vale só nesta visita.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Para `useSyncExternalStore`: avisa quando as escolhas mudam (nesta aba ou em outra). */
export function subscribePrefs(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
