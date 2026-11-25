// Destaque da interface (botões, item escolhido, aba ativa, anel de foco) na página do
// perfil: segue a paleta escolhida para a imagem, mas só se ficar legível sobre o fundo
// escuro do site. Senão, fica o âmbar. Função pura, com teste em ui-accent.test.ts.

import { THEME } from "../theme";
import { contrastRatio, hexToRgb, rgbToHex, type Palette } from "./palettes";

/** Contraste mínimo de texto normal (WCAG AA). */
export const AA = 4.5;

export type UiAccent = {
  /** Cor do destaque. */
  accent: string;
  /** Destaque ao passar o mouse (um pouco mais claro). */
  hover: string;
  /** Texto sobre o destaque. */
  ink: string;
};

/** O destaque padrão do site (âmbar). */
export const DEFAULT_UI_ACCENT: UiAccent = { accent: THEME.amber, hover: "#F0B257", ink: THEME.amberInk };

/** Mistura a cor com branco (amount de 0 a 1). */
function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
}

function buildUiAccent(accent: string, ink: string): UiAccent | null {
  const backgrounds = [THEME.room, THEME.card, THEME.card2];
  if (backgrounds.some((bg) => contrastRatio(accent, bg) < AA)) return null;
  if (contrastRatio(ink, accent) < AA) return null;
  // O hover clareia um pouco; se o texto do botão deixar de passar, o hover fica igual.
  const hover = lighten(accent, 0.15);
  return { accent, hover: contrastRatio(ink, hover) >= AA ? hover : accent, ink };
}

/**
 * Destaque da paleta para a interface, ou null se não passar no contraste AA:
 * o destaque precisa de 4,5:1 sobre o fundo e sobre os cartões do site (aparece como
 * texto e como contorno), e o texto do botão precisa de 4,5:1 sobre o destaque.
 * Em paletas claras (Papel, Rosa, Menta, Céu, Solar), o destaque do cartão é escuro
 * demais para o palco escuro — então usamos a própria cor de fundo do cartão (`room`).
 */
export function uiAccentFor(palette: Palette): UiAccent | null {
  if (palette.id === "ambar") return DEFAULT_UI_ACCENT;
  return buildUiAccent(palette.accent, palette.accentInk) ?? buildUiAccent(palette.room, palette.ink);
}
