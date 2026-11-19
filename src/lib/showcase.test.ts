import { describe, expect, it } from "vitest";
import vitrine from "@/data/vitrine.json";
import { DICTS } from "@/i18n";
import { HAND_MAX_WORDS, parseShowcase, SHOWCASE_MAX, wordCount } from "./showcase";

describe("parseShowcase", () => {
  it("lê legenda e itens, limpando espaços", () => {
    expect(parseShowcase({ legenda: " em evidência ", itens: [{ artista: " Iza ", album: "ZAZA " }] })).toEqual({
      caption: "em evidência",
      captionEn: "",
      captionEs: "",
      items: [{ artist: "Iza", album: "ZAZA" }],
    });
  });

  it("pula item sem artista ou sem álbum e corta em 6", () => {
    const itens = [{ artista: "A" }, { album: "B" }, ...Array.from({ length: 8 }, (_, i) => ({ artista: `X${i}`, album: "Y" }))];
    expect(parseShowcase({ itens }).items).toHaveLength(SHOWCASE_MAX);
    expect(parseShowcase({ itens }).items[0].artist).toBe("X0");
  });

  it("JSON estranho não quebra", () => {
    expect(parseShowcase(null)).toEqual({ caption: "", captionEn: "", captionEs: "", items: [] });
  });

  it("o arquivo de verdade (src/data/vitrine.json) é válido e tem pelo menos 4 álbuns", () => {
    expect(parseShowcase(vitrine).items.length).toBeGreaterThanOrEqual(4);
  });
});

describe("wordCount", () => {
  it("conta palavras e ignora espaços extras e a setinha", () => {
    expect(wordCount("em evidência este mês")).toBe(4);
    expect(wordCount("  ↑ em  alta no mundo hoje ")).toBe(5);
    expect(wordCount("")).toBe(0);
  });

  it("as legendas padrão e a da vitrine cabem na prateleira", () => {
    const v = parseShowcase(vitrine);
    for (const text of [v.caption, v.captionEn, v.captionEs]) expect(wordCount(text)).toBeLessThanOrEqual(HAND_MAX_WORDS);
    for (const d of Object.values(DICTS)) {
      expect(wordCount(d.home.showcaseCaption)).toBeLessThanOrEqual(HAND_MAX_WORDS);
      expect(wordCount(d.home.trendingCaption)).toBeLessThanOrEqual(HAND_MAX_WORDS);
    }
  });
});
