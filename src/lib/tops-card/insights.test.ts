import { describe, expect, it } from "vitest";
import { albumSharePercent, findDominantTrackAlbum } from "./insights";

describe("findDominantTrackAlbum", () => {
  it("identifica o álbum repetido quando 2 ou mais faixas são do mesmo disco", () => {
    const result = findDominantTrackAlbum([
      { artist: "Milo j", name: "Bajo De La Piel", album: "La Vida Era Más Corta" },
      { artist: "Milo j", name: "Niño", album: "La Vida Era Más Corta" },
      { artist: "Milo j", name: "Gil", album: "la vida era más corta" },
      { artist: "Milo j", name: "Recordé", album: "La Vida Era Más Corta" },
      { artist: "ROSALÍA", name: "LUX", album: "LUX" },
    ]);
    expect(result).toEqual({
      album: "La Vida Era Más Corta",
      count: 4,
      total: 5,
      firstTrackKey: "track:Milo j\u0000Bajo De La Piel",
    });
  });

  it("retorna null quando todas as faixas são de álbuns diferentes ou sem álbum", () => {
    expect(
      findDominantTrackAlbum([
        { artist: "A", name: "1", album: "Disco A" },
        { artist: "B", name: "2", album: "Disco B" },
        { artist: "C", name: "3", album: null },
      ]),
    ).toBeNull();
  });
});

describe("albumSharePercent", () => {
  it("calcula a porcentagem do álbum sobre as reproduções do artista e limita em 100%", () => {
    expect(albumSharePercent(307, 319)).toBe(96);
    expect(albumSharePercent(120, 100)).toBe(100);
    expect(albumSharePercent(0, 100)).toBeNull();
    expect(albumSharePercent(50, 0)).toBeNull();
  });
});
