import { describe, expect, it } from "vitest";
import { truncateText, wrapText } from "./text";

// Medida falsa: cada caractere vale 10 px.
const measure = (s: string) => Array.from(s).length * 10;

describe("truncateText", () => {
  it("devolve o texto inteiro quando cabe", () => {
    expect(truncateText("Abbey Road", 100, measure)).toBe("Abbey Road");
  });

  it("corta com reticências sem passar da largura", () => {
    const out = truncateText("The Dark Side of the Moon", 100, measure);
    expect(out).toBe("The Dark…");
    expect(measure(out)).toBeLessThanOrEqual(100);
  });

  it("não deixa espaço antes das reticências", () => {
    expect(truncateText("Abbey Road Remaster", 70, measure)).toBe("Abbey…");
  });

  it("não quebra emoji ao meio", () => {
    expect(truncateText("🎸🎸🎸🎸🎸", 30, measure)).toBe("🎸🎸…");
  });

  it("devolve só reticências quando nada cabe", () => {
    expect(truncateText("Abbey", 10, measure)).toBe("…");
  });
});

describe("wrapText", () => {
  it("quebra em linhas que cabem", () => {
    expect(wrapText("The Dark Side of the Moon", 100, 3, measure)).toEqual([
      "The Dark",
      "Side of",
      "the Moon",
    ]);
  });

  it("põe reticências na última linha quando sobra texto", () => {
    const lines = wrapText("The Dark Side of the Moon", 100, 2, measure);
    expect(lines).toEqual(["The Dark", "Side of t…"]);
  });

  it("corta palavra maior que a linha", () => {
    expect(wrapText("Supercalifragilistic", 100, 2, measure)).toEqual(["Supercali…"]);
  });

  it("texto vazio vira lista vazia", () => {
    expect(wrapText("   ", 100, 2, measure)).toEqual([]);
  });
});
