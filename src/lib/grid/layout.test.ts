import { describe, expect, it } from "vitest";
import {
  coverPxFor,
  coverUrl,
  GRID_CANVAS_SIDE,
  gridCells,
  gridFrame,
  gridLayout,
  recapCoverPx,
  storiesColumns,
  storiesLayout,
  thumbUrl,
} from "./layout";

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
  const dz = "https://cdn-images.dzcdn.net/images/cover/07ecc6f1b09e9b7b972ec598aabb9762";

  it("troca o tamanho no endereço", () => {
    expect(coverUrl(`${base}/300x300/abc.jpg`, 600)).toBe(`${base}/600x600/abc.jpg`);
    expect(coverUrl(`${base}/174s/abc.png`, 300)).toBe(`${base}/300x300/abc.png`);
    expect(coverUrl(`${base}/300x300/abc.jpg`, "original")).toBe(`${base}/abc.jpg`);
    expect(coverUrl(`${dz}/500x500-000000-80-0-0.jpg`, 600)).toBe(`${dz}/600x600-000000-80-0-0.jpg`);
    expect(coverUrl(`${dz}/500x500-000000-80-0-0.jpg`, "original")).toBe(`${dz}/1000x1000-000000-80-0-0.jpg`);
  });

  it("deixa igual o endereço sem trecho de tamanho", () => {
    expect(coverUrl(`${base}/abc.jpg`, 600)).toBe(`${base}/abc.jpg`);
  });
});

describe("thumbUrl", () => {
  const base = "https://lastfm-img.freetls.fastly.net/i/u";
  const dz = "https://cdn-images.dzcdn.net/images/artist/fbd45c09a10daa3d94efaae309f92af5";

  it("pede a miniatura 174s no Last.fm e 250x250 na Deezer", () => {
    expect(thumbUrl(`${base}/300x300/abc.jpg`)).toBe(`${base}/174s/abc.jpg`);
    expect(thumbUrl(`${base}/64s/abc.png`)).toBe(`${base}/174s/abc.png`);
    expect(thumbUrl(`${dz}/500x500-000000-80-0-0.jpg`)).toBe(`${dz}/250x250-000000-80-0-0.jpg`);
  });

  it("deixa igual o endereço sem trecho de tamanho", () => {
    expect(thumbUrl(`${base}/abc.jpg`)).toBe(`${base}/abc.jpg`);
  });
});

describe("coverPxFor", () => {
  it("usa 600 para quadrados maiores que 300 px", () => {
    expect(coverPxFor(500)).toBe(600);
    expect(coverPxFor(375)).toBe(600);
    expect(coverPxFor(300)).toBe(300);
  });
});

describe("tamanhos da imagem exportada", () => {
  it("a grade tem 2400 px (divisível por 3, 4 e 5) e só a 3x3 pede a original", () => {
    expect(GRID_CANVAS_SIDE).toBe(2400);
    for (const n of [3, 4, 5]) expect(Number.isInteger(GRID_CANVAS_SIDE / n)).toBe(true);
    expect(coverPxFor(GRID_CANVAS_SIDE / 3)).toBe("original");
    expect(coverPxFor(GRID_CANVAS_SIDE / 4)).toBe(600);
    expect(coverPxFor(GRID_CANVAS_SIDE / 5)).toBe(600);
  });

  it("no recap, só a capa principal pede a original", () => {
    expect([0, 1, 2, 8].map(recapCoverPx)).toEqual(["original", 600, 600, 600]);
  });
});

describe("storiesLayout", () => {
  it("3 colunas: 3x5 = 15 capas de 360, com 60 de sobra em cima e embaixo", () => {
    const cells = storiesLayout(3);
    expect(cells).toHaveLength(15);
    expect(cells[0]).toEqual({ index: 0, x: 0, y: 60, side: 360 });
    const last = cells.at(-1)!;
    expect(last).toEqual({ index: 14, x: 720, y: 1500, side: 360 });
    expect(1920 - (last.y + last.side)).toBe(60);
  });

  it("4 colunas: 4x6 = 24 capas de 270, com 150 de sobra em cima e embaixo", () => {
    const cells = storiesLayout(4);
    expect(cells).toHaveLength(24);
    expect(cells[0]).toEqual({ index: 0, x: 0, y: 150, side: 270 });
    expect(cells[5]).toEqual({ index: 5, x: 270, y: 420, side: 270 });
    const last = cells.at(-1)!;
    expect(last.x + last.side).toBe(1080);
    expect(1920 - (last.y + last.side)).toBe(150);
  });

  it("na exportação em 1,5x cada capa cai em pixel inteiro", () => {
    for (const cols of [3, 4] as const) {
      for (const c of storiesLayout(cols)) {
        expect(Number.isInteger(c.side * 1.5)).toBe(true);
        expect(Number.isInteger(c.y * 1.5)).toBe(true);
      }
    }
  });

  it("5x5 do quadrado vira 4 colunas nos Stories", () => {
    expect(storiesColumns(5)).toBe(4);
    expect(storiesColumns(3)).toBe(3);
    expect(gridCells(5, "stories")).toHaveLength(24);
    expect(gridCells(5, "square")).toHaveLength(25);
  });

  it("medidas de cada formato", () => {
    expect(gridFrame("stories")).toEqual({ width: 1080, height: 1920, scale: 1.5 });
    expect(gridFrame("square")).toEqual({ width: 1500, height: 1500, scale: 1.6 });
  });
});
