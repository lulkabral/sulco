import { describe, expect, it } from "vitest";
import { assignVinylFinishes, coverTone, hueDistance, pickVinylFinish, VINYL_FINISHES } from "./vinyl-color";
import { rgbToHsl } from "./recap/palettes";

describe("hueDistance", () => {
  it("calcula a menor distância no círculo de cores", () => {
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
    expect(hueDistance(205, 328)).toBe(123);
  });
});

describe("coverTone", () => {
  it("preserva fundo azul suave mesmo com pequeno detalhe quente saturado no centro", () => {
    const w = 24;
    const h = 24;
    const pixels = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const off = (y * w + x) * 4;
        const centerWarm = x >= 10 && x <= 14 && y >= 10 && y <= 14;
        // Fundo azul-celeste suave (como LUX) e pequeno detalhe laranja-dourado no miolo.
        pixels[off] = centerWarm ? 215 : 122;
        pixels[off + 1] = centerWarm ? 135 : 152;
        pixels[off + 2] = centerWarm ? 65 : 178;
        pixels[off + 3] = 255;
      }
    }
    const tone = coverTone(pixels, w, h);
    const { h: hue } = rgbToHsl(tone);
    expect(hue).toBeGreaterThan(180);
    expect(hue).toBeLessThan(235);
    const vinyl = pickVinylFinish(tone);
    expect(hueDistance(vinyl.hue, hue)).toBeGreaterThanOrEqual(110);
  });
});

describe("pickVinylFinish", () => {
  it("escolhe uma cor bem distante no círculo para capas coloridas", () => {
    const covers = [
      { r: 185, g: 40, b: 30 }, // vermelho escuro
      { r: 130, g: 168, b: 196 }, // azul claro
      { r: 45, g: 155, b: 85 }, // verde
      { r: 125, g: 68, b: 190 }, // roxo
      { r: 140, g: 100, b: 42 }, // marrom/dourado
    ];
    for (const rgb of covers) {
      const { h } = rgbToHsl(rgb);
      const picked = pickVinylFinish(rgb);
      expect(hueDistance(picked.hue, h)).toBeGreaterThanOrEqual(110);
    }
  });

  it("evita cores já usadas quando recebe o conjunto used", () => {
    const red = { r: 185, g: 40, b: 30 };
    const first = pickVinylFinish(red, "a");
    const second = pickVinylFinish(red, "b", new Set([first.id]));
    expect(second.id).not.toBe(first.id);
  });

  it("é determinístico para capas preto e branco", () => {
    const gray = { r: 120, g: 120, b: 120 };
    expect(pickVinylFinish(gray, "album-a")).toEqual(pickVinylFinish(gray, "album-a"));
  });
});

describe("assignVinylFinishes", () => {
  it("mantém null para capas ainda não carregadas e não repete cores nos 6 discos", () => {
    const items = [
      { color: { r: 130, g: 168, b: 196 }, seed: "1" },
      { color: { r: 185, g: 40, b: 30 }, seed: "2" },
      { color: { r: 120, g: 120, b: 120 }, seed: "3" },
      { color: { r: 140, g: 100, b: 42 }, seed: "4" },
      { color: null, seed: "5" },
      { color: { r: 165, g: 55, b: 115 }, seed: "6" },
    ];
    const result = assignVinylFinishes(items);
    expect(result[4]).toBeNull();
    const ids = result.filter((r) => r !== null).map((r) => r.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids.every((id) => VINYL_FINISHES.some((f) => f.id === id))).toBe(true);
  });
});
