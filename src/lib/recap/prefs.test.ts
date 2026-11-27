import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, parsePrefs } from "./prefs";

describe("parsePrefs", () => {
  it("sem nada guardado: padrão (Toca-discos, Âmbar, sem números, vinil clássico)", () => {
    expect(parsePrefs(null)).toEqual({
      layout: "toca-discos",
      paletteId: "ambar",
      showNumbers: false,
      vinylChoice: "classic",
      showUsername: true,
    });
  });

  it("lê escolhas válidas", () => {
    const raw = JSON.stringify({ layout: "lineup", paletteId: "capa", showNumbers: true, coloredVinyl: true, showUsername: false });
    expect(parsePrefs(raw)).toEqual({ layout: "lineup", paletteId: "capa", showNumbers: true, vinylChoice: "auto", showUsername: false });
  });

  it("guarda a cor personalizada e ignora cores inválidas", () => {
    expect(parsePrefs('{"vinylChoice":"#123abc"}').vinylChoice).toBe("#123abc");
    expect(parsePrefs('{"vinylChoice":"#xyzxyz"}').vinylChoice).toBe("classic");
  });

  it("campo inválido volta ao padrão só naquele campo", () => {
    const raw = JSON.stringify({ layout: "xyz", paletteId: "vinho", showNumbers: "sim", coloredVinyl: 1 });
    expect(parsePrefs(raw)).toEqual({ ...DEFAULT_PREFS, paletteId: "vinho" });
  });

  it("texto quebrado volta ao padrão", () => {
    expect(parsePrefs("{nao é json")).toEqual(DEFAULT_PREFS);
  });
});

describe("showUsername", () => {
  it("vem ligado por padrão e respeita o que foi guardado", () => {
    expect(parsePrefs(null).showUsername).toBe(true);
    expect(parsePrefs(JSON.stringify({ showUsername: false })).showUsername).toBe(false);
    expect(parsePrefs(JSON.stringify({ showUsername: "não" })).showUsername).toBe(true);
  });
});
