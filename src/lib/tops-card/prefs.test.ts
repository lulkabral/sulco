import { describe, expect, it } from "vitest";
import { DEFAULT_TOPS_PREFS, parseTopsCard, parseTopsPrefs } from "./prefs";

describe("tops-card/prefs", () => {
  it("valida ?card= da URL", () => {
    expect(parseTopsCard("artists")).toBe("artists");
    expect(parseTopsCard("tracks")).toBe("tracks");
    expect(parseTopsCard("albums")).toBe("albums");
    expect(parseTopsCard("genres")).toBe("genres");
    expect(parseTopsCard("other")).toBeNull();
    expect(parseTopsCard(undefined)).toBeNull();
  });

  it("cai para o padrão quando o JSON é inválido ou incompleto", () => {
    expect(parseTopsPrefs(null)).toEqual(DEFAULT_TOPS_PREFS);
    expect(parseTopsPrefs("{quebrado")).toEqual(DEFAULT_TOPS_PREFS);
    expect(parseTopsPrefs(JSON.stringify({ kind: "unknown", count: 15, paletteId: "fake" }))).toEqual(
      DEFAULT_TOPS_PREFS,
    );
  });

  it("migra a opção de vinil colorido para o modo automático", () => {
    expect(parseTopsPrefs('{"coloredVinyl":true}').vinylChoice).toBe("auto");
    expect(parseTopsPrefs('{"coloredVinyl":false}').vinylChoice).toBe("classic");
  });

  it("mantém escolhas válidas", () => {
    const saved = {
      kind: "albums",
      format: "square",
      count: 10,
      paletteId: "vinho",
      showNumbers: false,
      showUsername: false,
      vinylChoice: "#6a33cc",
    };
    expect(parseTopsPrefs(JSON.stringify(saved))).toEqual(saved);
  });
});
