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

  it("usa a capa do álbum mais ouvido do artista, ignorando maiúsculas", () => {
    expect(artistPictures([{ name: "Charli xcx" }], albums)).toEqual([{ image: "brat.jpg" }]);
  });

  it("pula álbum sem capa quando outro do artista tem capa", () => {
    expect(artistPictures([{ name: "MADONNA" }], albums)).toEqual([{ image: "conf.jpg" }]);
  });

  it("álbum sem capa: diz qual álbum buscar", () => {
    expect(artistPictures([{ name: "Gal Costa" }], albums)).toEqual([
      { image: null, lookup: { type: "album", artist: "Gal Costa", name: "India" } },
    ]);
  });

  it("sem álbum: usa a música mais ouvida (capa pronta ou a buscar)", () => {
    expect(artistPictures([{ name: "Bad Bunny" }, { name: "Janet Jackson" }], albums, tracks)).toEqual([
      { image: "dance.jpg" },
      { image: null, lookup: { type: "track", artist: "Janet Jackson", name: "Velvet Rope" } },
    ]);
  });

  it("sem álbum nem música: sem imagem", () => {
    expect(artistPictures([{ name: "Megadeth" }], albums, tracks)).toEqual([{ image: null }]);
  });
});
