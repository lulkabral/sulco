"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { COVER_PALETTE_ID, paletteById, type Palette } from "@/lib/recap/palettes";
import { parsePrefs, readPrefsRaw, subscribePrefs } from "@/lib/recap/prefs";
import { uiAccentFor } from "@/lib/recap/ui-accent";
import type { Tab } from "@/lib/tabs";
import { parseTopsPrefs, readTopsPrefsRaw, subscribeTopsPrefs } from "@/lib/tops-card/prefs";

/** Para o recap/tops avisar a paleta tirada da capa nº 1 (usada quando a escolha é "Cor da capa" / "Cor do #1"). */
const CoverPaletteContext = createContext<(p: Palette | null) => void>(() => {});

export function useReportCoverPalette() {
  return useContext(CoverPaletteContext);
}

/**
 * Página do perfil: o destaque da interface (botões, item escolhido, aba ativa, foco) usa a
 * cor da paleta escolhida para a imagem (no Recap ou no Tops). Se ela não passar no contraste
 * AA sobre o fundo escuro (Papel, algumas capas), fica o âmbar. O fundo não muda.
 */
export function AccentScope({ tab = "recap", children }: { tab?: Tab; children: ReactNode }) {
  const recapRaw = useSyncExternalStore(subscribePrefs, readPrefsRaw, () => null);
  const topsRaw = useSyncExternalStore(subscribeTopsPrefs, readTopsPrefsRaw, () => null);
  const recapPaletteId = useMemo(() => parsePrefs(recapRaw).paletteId, [recapRaw]);
  const topsPaletteId = useMemo(() => parseTopsPrefs(topsRaw).paletteId, [topsRaw]);
  const paletteId = tab === "tops" ? topsPaletteId : recapPaletteId;
  const [coverPalette, setCoverPalette] = useState<Palette | null>(null);

  const palette = paletteId === COVER_PALETTE_ID ? coverPalette : paletteById(paletteId);
  const ui = palette ? uiAccentFor(palette) : null;
  const style = ui
    ? ({ "--accent": ui.accent, "--accent-hover": ui.hover, "--accent-ink": ui.ink } as CSSProperties)
    : undefined;

  return (
    <CoverPaletteContext.Provider value={setCoverPalette}>
      <div className="contents" style={style}>
        {children}
      </div>
    </CoverPaletteContext.Provider>
  );
}
