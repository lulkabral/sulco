import { describe, expect, it } from "vitest";
import {
  computeTopGenres,
  computeCheckedGenres,
  genreKey,
  genreLabel,
  isNotGenre,
  looksLikeGenre,
  mapWithLimit,
} from "./genres";

describe("genreKey", () => {
  it("junta grafias do mesmo gênero", () => {
    expect(genreKey("Hip-Hop")).toBe("hip hop");
    expect(genreKey("hip hop")).toBe("hip hop");
    expect(genreKey("hiphop")).toBe("hip hop");
    expect(genreKey("RnB")).toBe("r&b");
    expect(genreKey("R&B")).toBe("r&b");
    expect(genreKey("K-Pop")).toBe("k pop");
    expect(genreKey("kpop")).toBe("k pop");
    expect(genreKey("  Nu   Metal ")).toBe("nu metal");
  });
});

describe("genreLabel", () => {
  it("usa a forma bonita quando existe", () => {
    expect(genreLabel("hip hop")).toBe("hip-hop");
    expect(genreLabel("r&b")).toBe("R&B");
    expect(genreLabel("punk rock")).toBe("punk rock");
  });

  it("sem forma na tabela, usa a grafia original em minúsculas", () => {
    expect(genreLabel("trip hop", "Trip-Hop")).toBe("trip-hop");
  });
});

describe("isNotGenre", () => {
  it.each([
    "seen live",
    "female vocalists",
    "male vocalistas",
    "my top songs",
    "the voice uk",
    "X Factor",
    "american",
    "United States",
    "Belgium",
    "spain",
    "chilean",
    "Icelandic",
    "Better than Nicki Minaj",
    "welsh",
    "covers",
  ])(
    "descarta %s",
    (tag) => {
      expect(isNotGenre(genreKey(tag), "qualquer")).toBe(true);
    },
  );

  it.each(["80s", "00s", "1990s", "2010", "11"])("descarta ano/década/número %s", (tag) => {
    expect(isNotGenre(tag, "qualquer")).toBe(true);
  });

  it("descarta o nome do próprio artista", () => {
    expect(isNotGenre("green day", "green day")).toBe(true);
    expect(isNotGenre("kpop demon hunters", genreKey("KPop Demon Hunters Cast"))).toBe(true);
  });

  it("não descarta gênero que só contém um país ou nacionalidade", () => {
    expect(isNotGenre(genreKey("french pop"), "angèle")).toBe(false);
    expect(isNotGenre(genreKey("latin pop"), "mon laferte")).toBe(false);
  });

  it("não descarta gênero de uma palavra que aparece no nome", () => {
    expect(isNotGenre("pop", "pop smoke")).toBe(false);
    expect(isNotGenre("rock", "green day")).toBe(false);
  });
});

describe("computeTopGenres", () => {
  const greenDay = {
    name: "Green Day",
    playcount: 20,
    tags: [
      { name: "punk rock", count: 100 },
      { name: "rock", count: 64 },
      { name: "punk", count: 38 },
      { name: "pop punk", count: 35 },
      { name: "alternative", count: 16 },
      { name: "alternative rock", count: 5 },
      { name: "green day", count: 1 },
    ],
  };

  it("peso = plays x força / 100, com só as 5 tags mais fortes", () => {
    const out = computeTopGenres([greenDay], 10);
    expect(out.map((g) => g.name)).toEqual(["punk rock", "rock", "punk", "pop punk", "alternative"]);
    expect(out[0].weight).toBeCloseTo(20);
    expect(out[1].weight).toBeCloseTo(12.8);
  });

  it("descarta antes de escolher as 5 mais fortes", () => {
    const jamie = {
      name: "Jamie Miller",
      playcount: 10,
      tags: [
        { name: "the voice", count: 100 },
        { name: "pop", count: 100 },
        { name: "the voice uk", count: 66 },
        { name: "soul", count: 17 },
        { name: "covers", count: 8 },
        { name: "welsh", count: 8 },
        { name: "singer-songwriter", count: 8 },
      ],
    };
    expect(computeTopGenres([jamie], 10).map((g) => g.name)).toEqual([
      "pop",
      "soul",
      "singer-songwriter",
    ]);
  });

  it("soma o mesmo gênero entre artistas e entre grafias", () => {
    const a = { name: "A", playcount: 10, tags: [{ name: "Hip-Hop", count: 100 }] };
    const b = { name: "B", playcount: 5, tags: [{ name: "hiphop", count: 100 }, { name: "hip hop", count: 50 }] };
    expect(computeTopGenres([a, b])).toEqual([{ name: "hip-hop", weight: 15, artists: ["A", "B"] }]);
  });

  it("guarda até 3 artistas por gênero, de quem mais puxou para quem menos", () => {
    const artists = ["A", "B", "C", "D"].map((name, i) => ({
      name,
      playcount: (i + 1) * 10,
      tags: [{ name: "pop", count: 100 }],
    }));
    expect(computeTopGenres(artists)[0].artists).toEqual(["D", "C", "B"]);
  });

  it("devolve no máximo 5, do mais pesado para o mais leve", () => {
    const tags = ["a", "b", "c", "d", "e"].map((name, i) => ({ name, count: 100 - i * 10 }));
    const more = [{ name: "f", count: 100 }];
    const out = computeTopGenres([
      { name: "X", playcount: 1, tags },
      { name: "Y", playcount: 1, tags: more },
    ]);
    expect(out).toHaveLength(5);
    expect(out[0].weight).toBeGreaterThanOrEqual(out[4].weight);
  });

  it("sem tags ou sem plays: lista vazia", () => {
    expect(computeTopGenres([])).toEqual([]);
    expect(computeTopGenres([{ name: "X", playcount: 5, tags: [] }])).toEqual([]);
  });
});

describe("mapWithLimit", () => {
  it("mantém a ordem e nunca passa do limite", async () => {
    let running = 0;
    let peak = 0;
    const out = await mapWithLimit([5, 1, 4, 2, 3, 0], 3, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, n));
      running--;
      return n * 2;
    });
    expect(out).toEqual([10, 2, 8, 4, 6, 0]);
    expect(peak).toBe(3);
  });

  it("lista vazia", async () => {
    expect(await mapWithLimit([], 3, async (n: number) => n)).toEqual([]);
  });
});

describe("looksLikeGenre", () => {
  it("aceita tag com descrição, mesmo pouco usada", () => {
    expect(looksLikeGenre({ reach: 37, hasWiki: true })).toBe(true); // pagode baiano
  });
  it("aceita tag sem descrição se muita gente usa", () => {
    expect(looksLikeGenre({ reach: 5000, hasWiki: false })).toBe(true);
  });
  it("recusa apelido de fã: sem descrição e pouco usado", () => {
    expect(looksLikeGenre({ reach: 309, hasWiki: false })).toBe(false); // martin (CORTIS)
  });
});

describe("computeCheckedGenres", () => {
  const artists = [
    { name: "CORTIS", playcount: 50, tags: [{ name: "Martin", count: 100 }, { name: "k-pop", count: 30 }] },
    { name: "Doechii", playcount: 40, tags: [{ name: "rap", count: 100 }, { name: "rnb", count: 70 }] },
  ];

  it("tira a tag recusada e põe a próxima no lugar", async () => {
    const asked: string[] = [];
    const isGenre = async (tag: string) => {
      asked.push(tag);
      return tag !== "martin";
    };
    const top = await computeCheckedGenres(artists, isGenre, 3);
    expect(top.map((g) => g.name)).toEqual(["rap", "R&B", "k-pop"]);
    // Cada tag é conferida uma vez, e só as que chegaram ao top.
    expect(new Set(asked).size).toBe(asked.length);
    expect(asked).toContain("martin");
  });

  it("não confere tag que nunca chega ao top", async () => {
    const asked: string[] = [];
    await computeCheckedGenres(artists, async (t) => (asked.push(t), true), 1);
    expect(asked).toEqual(["martin"]);
  });
});

describe("tags erradas e lugares", () => {
  it("tira as tags gregas só da Marina Sena", () => {
    expect(isNotGenre("greek pop", genreKey("Marina Sena"))).toBe(true);
    expect(isNotGenre("greek pop", genreKey("Outra Cantora"))).toBe(false);
  });
  it("tira estado e cidade, mas não gênero com lugar no nome", () => {
    expect(isNotGenre("texas", "don toliver")).toBe(true);
    expect(isNotGenre("detroit trap", "sexyy red")).toBe(false);
  });
});
