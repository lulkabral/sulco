import { describe, expect, it } from "vitest";
import { lineupTiers, packNames } from "./tiers";

const names = (n: number) => Array.from({ length: n }, (_, i) => `A${i + 1}`);

describe("lineupTiers", () => {
  it("1 | 2-3 | 4-7 | 8-15", () => {
    expect(lineupTiers(names(15))).toEqual([
      { level: 0, names: ["A1"] },
      { level: 1, names: ["A2", "A3"] },
      { level: 2, names: ["A4", "A5", "A6", "A7"] },
      { level: 3, names: ["A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15"] },
    ]);
  });

  it("ignora o que passa de 15", () => {
    expect(lineupTiers(names(20)).flatMap((t) => t.names)).toHaveLength(15);
  });

  it("poucos artistas: só os andares que dá para encher", () => {
    expect(lineupTiers(names(2))).toEqual([
      { level: 0, names: ["A1"] },
      { level: 1, names: ["A2"] },
    ]);
    expect(lineupTiers([])).toEqual([]);
  });
});

describe("packNames", () => {
  // Medida falsa: 10 px por caractere. O separador "  ·  " vale 50 px.
  const measure = (s: string) => Array.from(s).length * 10;

  it("quebra entre nomes, nunca no meio de um nome", () => {
    expect(packNames(["MADONNA", "TROYE SIVAN"], 150, 2, measure)).toEqual(["MADONNA", "TROYE SIVAN"]);
  });

  it("junta na mesma linha quando cabe", () => {
    expect(packNames(["A", "B", "C"], 1000, 2, measure)).toEqual(["A  ·  B  ·  C"]);
  });

  it("nome maior que a linha é cortado com reticências", () => {
    expect(packNames(["SUPERCALIFRAGILISTIC"], 100, 1, measure)).toEqual(["SUPERCALI…"]);
  });

  it("respeita o máximo de linhas", () => {
    expect(packNames(["AAAA", "BBBB", "CCCC"], 60, 2, measure)).toEqual(["AAAA", "BBBB"]);
  });
});
