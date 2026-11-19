import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, parsePrefs } from "./prefs";

describe("parsePrefs", () => {
  it("sem nada guardado: padrão (Toca-discos, Âmbar, sem números, vinil clássico)", () => {
    expect(parsePrefs(null)).toEqual({
      layout: "toca-discos",
      paletteId: "ambar",
      showNumbers: false,
      coloredVinyl: false,
    });
  });

  it("lê escolhas válidas", () => {
    const raw = JSON.stringify({ layout: "lineup", paletteId: "capa", showNumbers: true, coloredVinyl: true });
    expect(parsePrefs(raw)).toEqual({ layout: "lineup", paletteId: "capa", showNumbers: true, coloredVinyl: true });
  });

  it("campo inválido volta ao padrão só naquele campo", () => {
    const raw = JSON.stringify({ layout: "xyz", paletteId: "vinho", showNumbers: "sim", coloredVinyl: 1 });
    expect(parsePrefs(raw)).toEqual({ ...DEFAULT_PREFS, paletteId: "vinho" });
  });

  it("texto quebrado volta ao padrão", () => {
    expect(parsePrefs("{nao é json")).toEqual(DEFAULT_PREFS);
  });
});
