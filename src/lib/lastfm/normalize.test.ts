import { describe, expect, it } from "vitest";
import {
  normalizeAlbumCover,
  normalizeTrackCover,
  normalizeChartTracks,
  normalizeTrackDuration,
  normalizeTrackAlbum,
  normalizeArtistTags,
  normalizeChart,
  sumChartPlays,
  normalizeScrobblePage,
  normalizeRecentTotal,
  getLastfmErrorNumber,
  normalizeTop,
  normalizeUserInfo,
  pickImage,
  toArray,
} from "./normalize";
import type { TopAlbum, TopTrack } from "./types";

// Respostas reais do Last.fm (username trocado por "exemplo"), salvas em arquivo.
import userInfoRaw from "./__fixtures__/user-getinfo.json";
import topArtistsRaw from "./__fixtures__/user-gettopartists.json";
import topAlbumsRaw from "./__fixtures__/user-gettopalbums.json";
import topTracksRaw from "./__fixtures__/user-gettoptracks.json";
import topAlbumsEdgeRaw from "./__fixtures__/user-gettopalbums-edge.json";
import topAlbumsEmptyRaw from "./__fixtures__/user-gettopalbums-empty.json";
import notFoundRaw from "./__fixtures__/error-user-not-found.json";
import recentTotalRaw from "./__fixtures__/user-getrecenttracks-total.json";
import artistTagsRaw from "./__fixtures__/artist-gettoptags.json";
import scrobblePageRaw from "./__fixtures__/user-getrecenttracks-page.json";
import weeklyArtistsRaw from "./__fixtures__/user-getweeklyartistchart.json";
import weeklyAlbumsRaw from "./__fixtures__/user-getweeklyalbumchart.json";
import weeklyTracksRaw from "./__fixtures__/user-getweeklytrackchart.json";
import albumInfoRaw from "./__fixtures__/album-getinfo.json";

describe("normalizeUserInfo", () => {
  const user = normalizeUserInfo(userInfoRaw);

  it("converte os campos e transforma texto em número", () => {
    expect(user).toEqual({
      username: "exemplo",
      name: "Pessoa Exemplo",
      url: "https://www.last.fm/user/exemplo",
      avatarUrl:
        "https://lastfm-img.freetls.fastly.net/i/u/300x300/00000000000000000000000000000000.png",
      playcount: 69921,
      registeredAt: 1551562000,
    });
  });

  it("não deixa passar campos crus como #text ou @attr", () => {
    expect(JSON.stringify(user)).not.toMatch(/#text|@attr/);
  });

  it("usa null quando não há nome real nem avatar", () => {
    const u = normalizeUserInfo({ user: { name: "x1", realname: "", image: [{ "#text": "" }] } });
    expect(u.name).toBeNull();
    expect(u.avatarUrl).toBeNull();
    expect(u.url).toBe("https://www.last.fm/user/x1");
  });
});

describe("normalizeTop: artistas", () => {
  const { total, items } = normalizeTop("artists", topArtistsRaw);

  it("devolve lista com rank, nome, plays e url", () => {
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({
      rank: 1,
      name: "Milo j",
      playcount: 258,
      url: "https://www.last.fm/music/Milo+j",
    });
    expect(total).toBeGreaterThan(0);
  });

  it("não inclui imagem de artista (a API só devolve o placeholder)", () => {
    expect(items[0]).not.toHaveProperty("imageUrl");
  });
});

describe("normalizeTop: álbuns", () => {
  const { total, items } = normalizeTop("albums", topAlbumsRaw);
  const first = items[0] as TopAlbum;

  it("pega nome do artista dentro do objeto e a maior capa", () => {
    expect(items).toHaveLength(5);
    expect(total).toBe(45);
    expect(first).toEqual({
      rank: 1,
      name: "La Vida Era Más Corta",
      artist: "Milo j",
      playcount: 258,
      url: "https://www.last.fm/music/Milo+j/La+Vida+Era+M%C3%A1s+Corta",
      imageUrl:
        "https://lastfm-img.freetls.fastly.net/i/u/300x300/0fab8e18c03e112b925e378fbe8029cd.jpg",
    });
  });

  it("mantém a ordem do rank", () => {
    expect(items.map((i) => i.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("aceita item único como objeto e capa vazia vira null", () => {
    const edge = normalizeTop("albums", topAlbumsEdgeRaw);
    expect(edge.items).toHaveLength(1);
    expect((edge.items[0] as TopAlbum).imageUrl).toBeNull();
  });

  it("período sem scrobbles devolve lista vazia", () => {
    expect(normalizeTop("albums", topAlbumsEmptyRaw)).toEqual({ total: 0, items: [] });
  });
});

describe("normalizeTop: músicas", () => {
  it("pega nome da música e do artista", () => {
    const { items } = normalizeTop("tracks", topTracksRaw);
    const first = items[0] as TopTrack;
    expect(first.name).toBe("Bajo De La Piel");
    expect(first.artist).toBe("Milo j");
    expect(first.playcount).toBe(25);
    expect(first).not.toHaveProperty("imageUrl");
  });
});

describe("normalizeTop: resposta estranha", () => {
  it("não quebra com resposta vazia ou fora do formato", () => {
    expect(normalizeTop("albums", {})).toEqual({ total: 0, items: [] });
    expect(normalizeTop("tracks", null)).toEqual({ total: 0, items: [] });
    expect(normalizeTop("artists", { topartists: { artist: "x" } })).toEqual({
      total: 0,
      items: [],
    });
  });
});

describe("pickImage", () => {
  it("devolve a última (maior) imagem preenchida", () => {
    expect(pickImage([{ "#text": "a.jpg" }, { "#text": "b.jpg" }, { "#text": "" }])).toBe("b.jpg");
  });

  it("trata o placeholder de estrela como sem imagem", () => {
    expect(
      pickImage([
        { "#text": "https://lastfm-img.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png" },
      ]),
    ).toBeNull();
  });

  it("aceita lista vazia ou ausente", () => {
    expect(pickImage([])).toBeNull();
    expect(pickImage(undefined)).toBeNull();
  });
});

describe("toArray", () => {
  it("embrulha objeto único e ignora vazio", () => {
    expect(toArray({ a: 1 })).toEqual([{ a: 1 }]);
    expect(toArray([1, 2])).toEqual([1, 2]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray("")).toEqual([]);
  });
});

describe("getLastfmErrorNumber", () => {
  it("lê o número do erro", () => {
    expect(getLastfmErrorNumber(notFoundRaw)).toBe(6);
    expect(getLastfmErrorNumber({ error: "29", message: "x" })).toBe(29);
  });

  it("devolve null quando não é erro", () => {
    expect(getLastfmErrorNumber(userInfoRaw)).toBeNull();
    expect(getLastfmErrorNumber(null)).toBeNull();
  });
});

describe("normalizeRecentTotal", () => {
  it("lê o total do intervalo (vem como texto)", () => {
    expect(normalizeRecentTotal(recentTotalRaw)).toBe(108);
  });

  it("resposta estranha vira 0", () => {
    expect(normalizeRecentTotal({})).toBe(0);
    expect(normalizeRecentTotal(null)).toBe(0);
    expect(normalizeRecentTotal({ recenttracks: { "@attr": { total: "abc" } } })).toBe(0);
  });
});

describe("normalizeArtistTags", () => {
  it("lê nome e força das tags, na ordem do Last.fm", () => {
    const out = normalizeArtistTags(artistTagsRaw, "green day");
    expect(out.artist).toBe("Green Day");
    expect(out.tags[0]).toEqual({ name: "punk rock", count: 100 });
    expect(out.tags[1]).toEqual({ name: "rock", count: 64 });
  });

  it("aceita tag única como objeto e ignora tag sem nome", () => {
    const raw = { toptags: { tag: { name: " pop ", count: "100" } } };
    expect(normalizeArtistTags(raw, "X")).toEqual({ artist: "X", tags: [{ name: "pop", count: 100 }] });
    const empty = { toptags: { tag: [{ name: "", count: 5 }] } };
    expect(normalizeArtistTags(empty, "X").tags).toEqual([]);
  });

  it("resposta estranha vira lista vazia", () => {
    expect(normalizeArtistTags({}, "X")).toEqual({ artist: "X", tags: [] });
  });
});

describe("normalizeScrobblePage", () => {
  const page = normalizeScrobblePage(scrobblePageRaw);

  it("lê a paginação (números chegam como texto)", () => {
    expect(page).toMatchObject({ page: 1, totalPages: 86, total: 257 });
  });

  it("descarta a faixa tocando agora (sem data)", () => {
    expect(page.tracks).toHaveLength(4);
    expect(page.tracks.every((t) => t.playedAt > 0)).toBe(true);
  });

  it("normaliza cada scrobble", () => {
    expect(page.tracks[0]).toEqual({
      artist: "The Offspring",
      album: "Americana",
      name: "Staring at the Sun",
      url: expect.stringContaining("last.fm/music/The+Offspring"),
      imageUrl: expect.stringContaining("/300x300/"),
      playedAt: 1793118557,
    });
  });

  it("faixa sem álbum fica com album vazio e sem capa", () => {
    expect(page.tracks[3]).toMatchObject({ album: "", imageUrl: null });
  });

  it("resposta estranha vira página vazia", () => {
    expect(normalizeScrobblePage({})).toEqual({ page: 1, totalPages: 0, total: 0, tracks: [] });
  });
});

describe("normalizeChart", () => {
  it("artistas do gráfico: mesmo formato dos tops", () => {
    const items = normalizeChart("artists", weeklyArtistsRaw, 50);
    expect(items[0]).toEqual({ rank: 1, name: "Five", playcount: 31, url: "https://www.last.fm/music/Five" });
  });

  it("álbuns vêm com o artista do álbum e sem capa", () => {
    const [first] = normalizeChart("albums", weeklyAlbumsRaw, 50) as TopAlbum[];
    expect(first).toMatchObject({ rank: 1, artist: "Various Artists", playcount: 25, imageUrl: null });
  });

  it("músicas: a imagem é a estrela genérica, então fica sem imagem", () => {
    const [first] = normalizeChart("tracks", weeklyTracksRaw, 50) as TopTrack[];
    expect(first).toMatchObject({ rank: 1, name: "Got the Feelin' - Radio Edit", artist: "Five", playcount: 7 });
  });

  it("respeita o limite e aceita gráfico vazio", () => {
    expect(normalizeChart("artists", weeklyArtistsRaw, 2)).toHaveLength(2);
    expect(normalizeChart("albums", { weeklyalbumchart: { album: [] } }, 50)).toEqual([]);
  });
});

describe("normalizeAlbumCover", () => {
  it("pega a maior capa", () => {
    expect(normalizeAlbumCover(albumInfoRaw)).toContain("/300x300/");
  });

  it("sem capa ou resposta estranha: null", () => {
    expect(normalizeAlbumCover({ album: { image: [{ "#text": "" }] } })).toBeNull();
    expect(normalizeAlbumCover({})).toBeNull();
  });
});

describe("normalizeTrackCover", () => {
  it("pega a capa do álbum da música", () => {
    const raw = {
      track: {
        name: "Pop",
        album: {
          title: "Kiss All the Time. Disco, Occasionally.",
          image: [
            { "#text": "https://lastfm-img.freetls.fastly.net/i/u/64s/c2bd.png", size: "medium" },
            { "#text": "https://lastfm-img.freetls.fastly.net/i/u/300x300/c2bd.png", size: "extralarge" },
          ],
        },
      },
    };
    expect(normalizeTrackCover(raw)).toBe("https://lastfm-img.freetls.fastly.net/i/u/300x300/c2bd.png");
  });

  it("música sem álbum ou erro: null", () => {
    expect(normalizeTrackCover({ track: { name: "x" } })).toBeNull();
    expect(normalizeTrackCover({ error: 6, message: "Track not found" })).toBeNull();
  });
});

describe("normalizeTrackAlbum", () => {
  it("pega título e artista do álbum", () => {
    expect(normalizeTrackAlbum({ track: { album: { title: "Currents", artist: "Tame Impala" } } })).toEqual({
      title: "Currents",
      artist: "Tame Impala",
    });
  });

  it("sem álbum: null", () => {
    expect(normalizeTrackAlbum({ track: { name: "x" } })).toBeNull();
  });
});

describe("normalizeTrackDuration", () => {
  it("converte ms em segundos", () => {
    expect(normalizeTrackDuration({ track: { duration: "216000" } })).toBe(216);
  });

  it("0, ausente ou erro: null", () => {
    expect(normalizeTrackDuration({ track: { duration: "0" } })).toBeNull();
    expect(normalizeTrackDuration({ error: 6 })).toBeNull();
  });
});

describe("normalizeChartTracks", () => {
  it("pega nome e artista, na ordem, e pula itens quebrados", () => {
    const raw = {
      tracks: {
        track: [
          { name: "Nicole Kidman", artist: { name: "ADÉLA" } },
          { name: "", artist: { name: "X" } },
          { name: "the cure", artist: { name: "Olivia Rodrigo" } },
        ],
      },
    };
    expect(normalizeChartTracks(raw)).toEqual([
      { name: "Nicole Kidman", artist: "ADÉLA" },
      { name: "the cure", artist: "Olivia Rodrigo" },
    ]);
    expect(normalizeChartTracks({})).toEqual([]);
  });
});

describe("sumChartPlays", () => {
  it("soma a lista inteira, sem o corte", () => {
    // O exemplo salvo tem os 3 primeiros artistas de outubro de rj.
    const all = normalizeChart("artists", weeklyArtistsRaw, 50).reduce((s, a) => s + a.playcount, 0);
    expect(sumChartPlays("artists", weeklyArtistsRaw)).toBe(all);
    expect(sumChartPlays("artists", {})).toBe(0);
  });
});
