import { describe, expect, it } from "vitest";
import vitrine from "@/data/vitrine.json";
import { parseShowcase, SHOWCASE_MAX } from "./showcase";

describe("parseShowcase", () => {
  it("lê legenda e itens, limpando espaços", () => {
    expect(parseShowcase({ legenda: " em evidência ", itens: [{ artista: " Iza ", album: "ZAZA " }] })).toEqual({
      caption: "em evidência",
      items: [{ artist: "Iza", album: "ZAZA" }],
    });
  });

  it("pula item sem artista ou sem álbum e corta em 6", () => {
    const itens = [{ artista: "A" }, { album: "B" }, ...Array.from({ length: 8 }, (_, i) => ({ artista: `X${i}`, album: "Y" }))];
    expect(parseShowcase({ itens }).items).toHaveLength(SHOWCASE_MAX);
    expect(parseShowcase({ itens }).items[0].artist).toBe("X0");
  });

  it("JSON estranho não quebra", () => {
    expect(parseShowcase(null)).toEqual({ caption: "", items: [] });
  });

  it("o arquivo de verdade (src/data/vitrine.json) é válido e tem pelo menos 4 álbuns", () => {
    expect(parseShowcase(vitrine).items.length).toBeGreaterThanOrEqual(4);
  });
});
