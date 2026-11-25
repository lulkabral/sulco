// Preferências dos cards da aba Tops (categoria, formato, quantidade, paleta e switches),
// guardadas só no navegador do visitante (localStorage).

import { COVER_PALETTE_ID, PALETTES } from "@/lib/recap/palettes";

export const TOPS_CARD_KINDS = ["artists", "tracks", "albums", "genres"] as const;
export type TopsCardKind = (typeof TOPS_CARD_KINDS)[number];

export const TOPS_FORMATS = ["stories", "square"] as const;
export type TopsCardFormat = (typeof TOPS_FORMATS)[number];

export const TOPS_COUNTS = [5, 10] as const;
export type TopsCardCount = (typeof TOPS_COUNTS)[number];

export type TopsPrefs = {
  kind: TopsCardKind;
  format: TopsCardFormat;
  count: TopsCardCount;
  paletteId: string;
  showNumbers: boolean;
  showUsername: boolean;
  coloredVinyl: boolean;
};

export const DEFAULT_TOPS_PREFS: TopsPrefs = {
  kind: "artists",
  format: "stories",
  count: 5,
  paletteId: "esmeralda",
  showNumbers: true,
  showUsername: true,
  coloredVinyl: false,
};

const KEY = "tops-prefs";
const EVENT = "tops-prefs-change";

/** Lê o `?card=` da URL e devolve um tipo válido, ou null. */
export function parseTopsCard(raw: string | string[] | undefined): TopsCardKind | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return TOPS_CARD_KINDS.find((k) => k === value) ?? null;
}

export function parseTopsPrefs(raw: string | null): TopsPrefs {
  if (!raw) return DEFAULT_TOPS_PREFS;
  try {
    const data = JSON.parse(raw) as Partial<Record<keyof TopsPrefs, unknown>>;
    const validKind = TOPS_CARD_KINDS.includes(data.kind as TopsCardKind);
    const validFormat = TOPS_FORMATS.includes(data.format as TopsCardFormat);
    const validCount = TOPS_COUNTS.includes(data.count as TopsCardCount);
    const validPalette =
      data.paletteId === COVER_PALETTE_ID || PALETTES.some((p) => p.id === data.paletteId);
    return {
      kind: validKind ? (data.kind as TopsCardKind) : DEFAULT_TOPS_PREFS.kind,
      format: validFormat ? (data.format as TopsCardFormat) : DEFAULT_TOPS_PREFS.format,
      count: validCount ? (data.count as TopsCardCount) : DEFAULT_TOPS_PREFS.count,
      paletteId: validPalette ? (data.paletteId as string) : DEFAULT_TOPS_PREFS.paletteId,
      showNumbers: typeof data.showNumbers === "boolean" ? data.showNumbers : DEFAULT_TOPS_PREFS.showNumbers,
      showUsername: typeof data.showUsername === "boolean" ? data.showUsername : DEFAULT_TOPS_PREFS.showUsername,
      coloredVinyl: typeof data.coloredVinyl === "boolean" ? data.coloredVinyl : DEFAULT_TOPS_PREFS.coloredVinyl,
    };
  } catch {
    return DEFAULT_TOPS_PREFS;
  }
}

export function readTopsPrefsRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveTopsPrefs(prefs: TopsPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Sem armazenamento: vale só nesta visita.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTopsPrefs(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
