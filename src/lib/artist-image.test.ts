import { describe, expect, it } from "vitest";
import { artistImages } from "./artist-image";

describe("artistImages", () => {
  const albums = [
    { artist: "Charli xcx", imageUrl: "brat.jpg" },
    { artist: "Madonna", imageUrl: null },
    { artist: "charli XCX", imageUrl: "crash.jpg" },
    { artist: "Madonna", imageUrl: "ray.jpg" },
  ];

  it("usa a capa do álbum mais ouvido do artista", () => {
    expect(artistImages([{ name: "Charli xcx" }], albums)).toEqual(["brat.jpg"]);
  });

  it("pula álbum sem capa e ignora maiúsculas", () => {
    expect(artistImages([{ name: "MADONNA" }], albums)).toEqual(["ray.jpg"]);
  });

  it("artista sem álbum fica sem imagem", () => {
    expect(artistImages([{ name: "Bad Bunny" }], albums)).toEqual([null]);
  });
});
