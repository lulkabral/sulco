import { describe, expect, it } from "vitest";
import { artistPictures } from "./artist-image";

describe("artistPictures", () => {
  const albums = [
    { name: "Brat", artist: "Charli xcx", imageUrl: "brat.jpg" },
    { name: "Ray of Light", artist: "Madonna", imageUrl: null },
    { name: "Crash", artist: "charli XCX", imageUrl: "crash.jpg" },
    { name: "Confessions", artist: "Madonna", imageUrl: "conf.jpg" },
    { name: "India", artist: "Gal Costa", imageUrl: null },
  ];
  const tracks = [
    { name: "Velvet Rope", artist: "Janet Jackson" },
    { name: "Dance", artist: "Bad Bunny", imageUrl: "dance.jpg" },
  ];

  it("tenta a foto do artista primeiro e guarda a capa do álbum já conhecida como reserva", () => {
    expect(artistPictures([{ name: "Charli xcx" }], albums)).toEqual([
      { image: null, lookup: { type: "artist", artist: "Charli xcx", name: "Charli xcx", fallbackUrl: "brat.jpg" } },
    ]);
  });

  it("pula álbum sem capa e guarda a primeira capa disponível como reserva, ignorando maiúsculas", () => {
    expect(artistPictures([{ name: "MADONNA" }], albums)).toEqual([
      { image: null, lookup: { type: "artist", artist: "MADONNA", name: "MADONNA", fallbackUrl: "conf.jpg" } },
    ]);
  });

  it("álbum sem capa: busca a foto do artista e reserva o álbum para buscar se falhar", () => {
    expect(artistPictures([{ name: "Gal Costa" }], albums)).toEqual([
      {
        image: null,
        lookup: {
          type: "artist",
          artist: "Gal Costa",
          name: "Gal Costa",
          fallback: { type: "album", artist: "Gal Costa", name: "India" },
        },
      },
    ]);
  });

  it("sem álbum: reserva a música mais ouvida (capa pronta ou a buscar)", () => {
    expect(artistPictures([{ name: "Bad Bunny" }, { name: "Janet Jackson" }], albums, tracks)).toEqual([
      {
        image: null,
        lookup: { type: "artist", artist: "Bad Bunny", name: "Bad Bunny", fallbackUrl: "dance.jpg" },
      },
      {
        image: null,
        lookup: {
          type: "artist",
          artist: "Janet Jackson",
          name: "Janet Jackson",
          fallback: { type: "track", artist: "Janet Jackson", name: "Velvet Rope" },
        },
      },
    ]);
  });

  it("sem álbum nem música: busca só a foto do artista", () => {
    expect(artistPictures([{ name: "Megadeth" }], albums, tracks)).toEqual([
      { image: null, lookup: { type: "artist", artist: "Megadeth", name: "Megadeth" } },
    ]);
  });
});
