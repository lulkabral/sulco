import { describe, expect, it } from "vitest";
import { coverPxFor, coverUrl, gridLayout } from "./layout";

describe("gridLayout", () => {
  it("3x3 tem 9 quadrados de 500 px", () => {
    const cells = gridLayout(3);
    expect(cells).toHaveLength(9);
    expect(cells[0]).toEqual({ index: 0, x: 0, y: 0, side: 500 });
    expect(cells[4]).toEqual({ index: 4, x: 500, y: 500, side: 500 });
    expect(cells[8]).toEqual({ index: 8, x: 1000, y: 1000, side: 500 });
  });

  it("5x5 preenche linha por linha", () => {
    const cells = gridLayout(5);
    expect(cells).toHaveLength(25);
    expect(cells[5]).toEqual({ index: 5, x: 0, y: 300, side: 300 });
  });

  it("os quadrados cobrem a imagem inteira sem sobrar pixel", () => {
    for (const size of [3, 4, 5] as const) {
      const last = gridLayout(size).at(-1)!;
      expect(last.x + last.side).toBe(1500);
      expect(Number.isInteger(last.side)).toBe(true);
    }
  });
});

describe("coverUrl", () => {
  const base = "https://lastfm-img.freetls.fastly.net/i/u";

  it("troca o tamanho no endereço", () => {
    expect(coverUrl(`${base}/300x300/abc.jpg`, 600)).toBe(`${base}/600x600/abc.jpg`);
    expect(coverUrl(`${base}/174s/abc.png`, 300)).toBe(`${base}/300x300/abc.png`);
  });

  it("deixa igual o endereço sem trecho de tamanho", () => {
    expect(coverUrl(`${base}/abc.jpg`, 600)).toBe(`${base}/abc.jpg`);
  });
});

describe("coverPxFor", () => {
  it("usa 600 para quadrados maiores que 300 px", () => {
    expect(coverPxFor(500)).toBe(600);
    expect(coverPxFor(375)).toBe(600);
    expect(coverPxFor(300)).toBe(300);
  });
});
