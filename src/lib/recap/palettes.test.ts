import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  dominantColor,
  hexToRgb,
  hslToRgb,
  PALETTES,
  paletteById,
  paletteFromColor,
  rgbToHex,
  rgbToHsl,
} from "./palettes";

/** Pixels RGBA de teste: `n` pixels da mesma cor. */
function pixels(n: number, [r, g, b]: [number, number, number]): number[] {
  return Array.from({ length: n }, () => [r, g, b, 255]).flat();
}

describe("conversões de cor", () => {
  it("hex <-> rgb", () => {
    expect(hexToRgb("#E8A13A")).toEqual({ r: 232, g: 161, b: 58 });
    expect(rgbToHex({ r: 232, g: 161, b: 58 })).toBe("#E8A13A");
  });

  it("rgb -> hsl -> rgb volta à mesma cor", () => {
    const c = { r: 120, g: 60, b: 200 };
    const { h, s, l } = rgbToHsl(c);
    expect(rgbToHex(hslToRgb(h, s, l))).toBe(rgbToHex(c));
  });

  it("contraste: preto e branco = 21; igual = 1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
    expect(contrastRatio("#E8A13A", "#E8A13A")).toBeCloseTo(1);
  });
});

describe("paletas prontas", () => {
  it.each(PALETTES.map((p) => [p.name, p] as const))("%s é legível", (_, p) => {
    // Texto principal e de apoio sobre fundo e cartão: pelo menos 4,5 (texto normal).
    for (const bg of [p.room, p.card]) {
      expect(contrastRatio(p.ink, bg)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(p.inkSoft, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.accent, bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(p.accentInk, p.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("id desconhecido vira a primeira (Âmbar)", () => {
    expect(paletteById("nao-existe").id).toBe("ambar");
    expect(paletteById("vinho").name).toBe("Vinho");
  });
});

describe("dominantColor", () => {
  it("a cor saturada ganha do cinza, mesmo sendo minoria", () => {
    const img = [...pixels(70, [128, 128, 128]), ...pixels(30, [200, 40, 40])];
    const c = dominantColor(img);
    expect(c.r).toBeGreaterThan(150);
    expect(c.g).toBeLessThan(80);
  });

  it("ignora quase preto e quase branco", () => {
    const img = [...pixels(50, [0, 0, 0]), ...pixels(50, [255, 255, 255]), ...pixels(5, [40, 90, 200])];
    expect(rgbToHex(dominantColor(img))).toBe("#285AC8");
  });

  it("imagem toda cinza: média simples", () => {
    expect(dominantColor(pixels(10, [90, 90, 90]))).toEqual({ r: 90, g: 90, b: 90 });
  });
});

describe("paletteFromColor", () => {
  it.each([
    ["vermelho", { r: 200, g: 40, b: 40 }],
    ["azul escuro", { r: 20, g: 30, b: 90 }],
    ["amarelo", { r: 240, g: 220, b: 60 }],
    ["cinza", { r: 128, g: 128, b: 128 }],
  ])("capa %s gera paleta legível", (_, color) => {
    const p = paletteFromColor(color);
    expect(contrastRatio(p.accent, p.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.ink, p.card)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(p.inkSoft, p.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.accentInk, p.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("o destaque mantém o matiz da capa", () => {
    const red = rgbToHsl(hexToRgb(paletteFromColor({ r: 200, g: 40, b: 40 }).accent));
    expect(red.h < 15 || red.h > 345).toBe(true);
  });
});
