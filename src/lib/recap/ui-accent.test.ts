import { describe, expect, it } from "vitest";
import { THEME } from "../theme";
import { contrastRatio, paletteById, paletteFromColor } from "./palettes";
import { AA, DEFAULT_UI_ACCENT, uiAccentFor } from "./ui-accent";

describe("uiAccentFor", () => {
  it("âmbar é o padrão do site", () => {
    expect(uiAccentFor(paletteById("ambar"))).toEqual(DEFAULT_UI_ACCENT);
  });

  it("paletas escuras levam o destaque delas para a interface", () => {
    for (const id of ["meia-noite", "vinho", "lilas"]) {
      expect(uiAccentFor(paletteById(id))?.accent).toBe(paletteById(id).accent);
    }
  });

  it("Papel (destaque escuro) não passa sobre o fundo do site e volta ao âmbar", () => {
    expect(uiAccentFor(paletteById("papel"))).toBeNull();
  });

  it("o que for aceito sempre passa no AA, inclusive cores tiradas de capas", () => {
    const colors = [];
    for (let r = 0; r <= 255; r += 51) for (let g = 0; g <= 255; g += 51) for (let b = 0; b <= 255; b += 51) colors.push({ r, g, b });
    for (const c of colors) {
      const ui = uiAccentFor(paletteFromColor(c));
      if (!ui) continue;
      for (const bg of [THEME.room, THEME.card, THEME.card2]) expect(contrastRatio(ui.accent, bg)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(ui.ink, ui.accent)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(ui.ink, ui.hover)).toBeGreaterThanOrEqual(AA);
    }
  });
});
