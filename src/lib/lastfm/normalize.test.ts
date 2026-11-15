import { describe, expect, it } from "vitest";
import {
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
