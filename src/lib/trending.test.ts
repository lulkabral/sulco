import { describe, expect, it } from "vitest";
import { rankTrendingAlbums } from "./trending";

describe("rankTrendingAlbums", () => {
  const t = (album: string | null, artist: string | null, img: string | null = `${album}.png`) => ({
    album,
    albumArtist: artist,
    imageUrl: img,
  });

  it("soma pontos por posição: duas músicas no ranking passam na frente", () => {
    // 4 músicas: posições valem 4, 3, 2, 1. B tem 3 + 1 = 4; A tem 4 (empate, A apareceu antes).
    const out = rankTrendingAlbums([t("A", "X"), t("B", "Y"), t("C", "Z"), t("B", "Y")]);
    expect(out.map((c) => c.name)).toEqual(["A", "B", "C"]);
    const out2 = rankTrendingAlbums([t("A", "X"), t("B", "Y"), t("B", "Y"), t("C", "Z")]);
    expect(out2.map((c) => c.name)).toEqual(["B", "A", "C"]);
  });

  it("junta o mesmo álbum mesmo com maiúsculas diferentes", () => {
    expect(rankTrendingAlbums([t("Brat", "Charli xcx"), t("BRAT", "charli XCX")])).toHaveLength(1);
  });

  it("pula sem álbum, sem capa e coletâneas", () => {
    const out = rankTrendingAlbums([t(null, "X"), t("Sem capa", "Y", null), t("Hits", "Various Artists"), t("Ok", "Z")]);
    expect(out.map((c) => c.name)).toEqual(["Ok"]);
  });

  it("para no máximo pedido", () => {
    expect(rankTrendingAlbums([t("A", "1"), t("B", "2"), t("C", "3")], 2)).toHaveLength(2);
  });
});
