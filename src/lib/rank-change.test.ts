import { describe, expect, it } from "vitest";
import {
  computeGenreRankChanges,
  computeRankChanges,
  hasAnyRankChange,
  previousHistoryPeriod,
  previousMonthId,
  previousUiPeriodRange,
  rankKey,
} from "./rank-change";

describe("rankKey", () => {
  it("normaliza maiúsculas e espaços extras", () => {
    expect(rankKey("  Milo   J ")).toBe("milo j");
    expect(rankKey("ROSALÍA", "  Bajo  De La Piel")).toBe("rosalía\u0000bajo de la piel");
  });
});

describe("computeRankChanges", () => {
  it("calcula subida, queda, mesma posição e estreia", () => {
    const current = [
      { rank: 1, name: "Milo j" },
      { rank: 2, name: "ROSALÍA" },
      { rank: 3, name: "Madonna" },
      { rank: 4, name: "Charli xcx" },
    ];
    const previous = [
      { rank: 1, name: "Madonna" },
      { rank: 2, name: "IZA" },
      { rank: 3, name: "rosalía" },
      { rank: 4, name: "Charli  XCX" },
    ];

    const changes = computeRankChanges(
      current,
      previous,
      (a) => rankKey(a.name),
      (a) => rankKey(a.name),
      (a) => a.rank,
      (a) => a.rank,
    );

    expect(changes).toEqual([
      { status: "new" },
      { status: "up", delta: 1, prevRank: 3 },
      { status: "down", delta: 2, prevRank: 1 },
      { status: "same", prevRank: 4 },
    ]);
  });

  it("devolve tudo null quando o período anterior está vazio", () => {
    const current = [{ name: "Milo j" }, { name: "ROSALÍA" }];
    expect(
      computeRankChanges(
        current,
        [],
        (a) => rankKey(a.name),
        (a: { name: string }) => rankKey(a.name),
      ),
    ).toEqual([null, null]);
  });

  it("mantém a melhor posição quando uma chave aparece repetida na lista anterior", () => {
    const current = [{ name: "Artist A" }];
    const previous = [
      { rank: 2, name: "Artist A" },
      { rank: 15, name: "artist a" },
    ];
    expect(
      computeRankChanges(
        current,
        previous,
        (a) => rankKey(a.name),
        (a) => rankKey(a.name),
        (_, i) => i + 1,
        (a) => a.rank,
      ),
    ).toEqual([{ status: "up", delta: 1, prevRank: 2 }]);
  });

  it("identifica músicas e álbuns pela dupla artista + título", () => {
    const current = [
      { artist: "Artist A", name: "Intro" },
      { artist: "Artist B", name: "Intro" },
    ];
    const previous = [{ artist: "Artist B", name: "Intro" }];
    const changes = computeRankChanges(
      current,
      previous,
      (t) => rankKey(t.artist, t.name),
      (t) => rankKey(t.artist, t.name),
    );
    expect(changes).toEqual([{ status: "new" }, { status: "down", delta: 1, prevRank: 1 }]);
  });
});

describe("computeGenreRankChanges", () => {
  it("casa variações de grafia do mesmo gênero via genreKey", () => {
    const current = [{ name: "hip-hop" }, { name: "R&B" }, { name: "mpb" }];
    const previous = [{ name: "rnb" }, { name: "pop" }, { name: "hip hop" }];
    expect(computeGenreRankChanges(current, previous)).toEqual([
      { status: "up", delta: 2, prevRank: 3 },
      { status: "down", delta: 1, prevRank: 1 },
      { status: "new" },
    ]);
  });
});

describe("hasAnyRankChange", () => {
  it("retorna false para null, vazio ou só nulls", () => {
    expect(hasAnyRankChange(null)).toBe(false);
    expect(hasAnyRankChange([])).toBe(false);
    expect(hasAnyRankChange([null, null])).toBe(false);
    expect(hasAnyRankChange([null, { status: "new" }])).toBe(true);
  });
});

describe("previousUiPeriodRange", () => {
  const now = 1_795_357_200; // 2026-11-22
  const month = { from: now - 30 * 86_400, to: now };

  it("devolve null para overall", () => {
    expect(previousUiPeriodRange("overall", { from: 1_600_000_000, to: now })).toBeNull();
  });

  it("calcula o bloco imediatamente anterior com a mesma duração", () => {
    const prev = previousUiPeriodRange("1month", month);
    expect(prev).toEqual({ from: month.from - 30 * 86_400, to: month.from - 1 });
  });

  it("devolve null quando o período anterior termina antes do cadastro", () => {
    const registeredJustNow = month.from + 100;
    expect(previousUiPeriodRange("1month", month, registeredJustNow)).toBeNull();
  });

  it("aceita período anterior que sobrepõe o cadastro", () => {
    const registeredMidPrev = month.from - 10 * 86_400;
    expect(previousUiPeriodRange("1month", month, registeredMidPrev)).toEqual({
      from: month.from - 30 * 86_400,
      to: month.from - 1,
    });
  });
});

describe("previousMonthId", () => {
  it("recua o mês e vira o ano em janeiro", () => {
    expect(previousMonthId("2026-10")).toBe("2026-09");
    expect(previousMonthId("2026-01")).toBe("2025-12");
    expect(previousMonthId("2002-01")).toBeNull();
    expect(previousMonthId("invalido")).toBeNull();
  });
});

describe("previousHistoryPeriod", () => {
  const now = 1_795_357_200;

  it("calcula mês anterior e respeita registeredAt", () => {
    const prev = previousHistoryPeriod("2026-10", now, 0);
    expect(prev?.kind).toBe("month");
    if (prev?.kind === "month") {
      expect(prev.id).toBe("2026-09");
      expect(prev.range.to).toBeGreaterThan(prev.range.from);
      // Cadastrado em outubro -> setembro é descartado
      expect(previousHistoryPeriod("2026-10", now, prev.range.to + 1)).toBeNull();
    }
  });

  it("calcula ano anterior", () => {
    const prev = previousHistoryPeriod("2026", now, 0);
    expect(prev?.kind).toBe("year");
    if (prev?.kind === "year") {
      expect(prev.year).toBe(2025);
      expect(prev.range.to - prev.range.from).toBeGreaterThan(360 * 86_400);
    }
  });
});
