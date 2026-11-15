import { describe, expect, it } from "vitest";
import type { Scrobble } from "@/lib/lastfm/types";
import { aggregateScrobbles, lastfmMusicUrl } from "./aggregate";

let clock = 2_000_000_000;
/** Scrobble de teste; cada chamada é um pouco mais antiga (como a API devolve). */
function s(artist: string, name: string, album = "", imageUrl: string | null = null): Scrobble {
  clock -= 60;
  return { artist, name, album, imageUrl, url: "", playedAt: clock };
}

describe("aggregateScrobbles", () => {
  const scrobbles = [
    s("Green Day", "Basket Case", "Dookie", "https://img/dookie.jpg"),
    s("Green Day", "Longview", "Dookie"),
    s("Pulp", "Common People", "Different Class"),
    s("Green Day", "Basket Case", "Dookie"),
    s("Pulp", "Disco 2000", "Different Class", "https://img/dc.jpg"),
    s("Sublime", "Santeria", ""),
  ];
  const out = aggregateScrobbles(scrobbles);

  it("total = scrobbles somados", () => {
    expect(out.total).toBe(6);
  });

  it("soma por artista, do mais tocado para o menos", () => {
    expect(out.artists.map((a) => [a.rank, a.name, a.playcount])).toEqual([
      [1, "Green Day", 3],
      [2, "Pulp", 2],
      [3, "Sublime", 1],
    ]);
  });

  it("soma por música (artista + nome)", () => {
    expect(out.tracks[0]).toMatchObject({ rank: 1, name: "Basket Case", artist: "Green Day", playcount: 2 });
    expect(out.tracks).toHaveLength(5);
  });

  it("soma por álbum; faixa sem álbum não vira álbum", () => {
    expect(out.albums.map((a) => [a.name, a.playcount])).toEqual([
      ["Dookie", 3],
      ["Different Class", 2],
    ]);
  });

  it("a capa do álbum é a primeira encontrada, mesmo que não seja do 1º scrobble", () => {
    expect(out.albums[0].imageUrl).toBe("https://img/dookie.jpg");
    expect(out.albums[1].imageUrl).toBe("https://img/dc.jpg");
  });

  it("monta os links do Last.fm", () => {
    expect(out.artists[0].url).toBe("https://www.last.fm/music/Green+Day");
    expect(out.albums[1].url).toBe("https://www.last.fm/music/Pulp/Different+Class");
  });

  it("empate: vem primeiro o que tocou mais recentemente", () => {
    const tie = aggregateScrobbles([s("B", "x"), s("A", "y")]);
    expect(tie.artists.map((a) => a.name)).toEqual(["B", "A"]);
  });

  it("ignora maiúsculas e espaços ao juntar, mantendo a primeira grafia", () => {
    const mixed = aggregateScrobbles([s("Green Day", "Basket Case"), s("green day ", "basket case")]);
    expect(mixed.artists).toHaveLength(1);
    expect(mixed.artists[0]).toMatchObject({ name: "Green Day", playcount: 2 });
    expect(mixed.tracks).toHaveLength(1);
  });

  it("ignora scrobble sem data (tocando agora) e sem artista", () => {
    const nowPlaying = { ...s("Green Day", "Basket Case"), playedAt: 0 };
    const noArtist = s("", "Sem artista");
    const result = aggregateScrobbles([nowPlaying, noArtist, s("Pulp", "Babies")]);
    expect(result.total).toBe(1);
    expect(result.artists.map((a) => a.name)).toEqual(["Pulp"]);
  });

  it("lista vazia", () => {
    expect(aggregateScrobbles([])).toEqual({ total: 0, artists: [], albums: [], tracks: [] });
  });
});

describe("lastfmMusicUrl", () => {
  it("espaço vira + e o resto é codificado", () => {
    expect(lastfmMusicUrl("AC/DC", "Back in Black")).toBe("https://www.last.fm/music/AC%2FDC/Back+in+Black");
    expect(lastfmMusicUrl("Sigur Rós")).toBe("https://www.last.fm/music/Sigur+R%C3%B3s");
  });
});
