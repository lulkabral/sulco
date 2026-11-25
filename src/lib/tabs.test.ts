import { describe, expect, it } from "vitest";
import { parseTab, userPageHref } from "./tabs";

describe("parseTab", () => {
  it("aceita as abas conhecidas", () => {
    expect(parseTab("grade")).toBe("grade");
    expect(parseTab("recap")).toBe("recap");
    expect(parseTab("tops")).toBe("tops");
  });

  it("valor ausente ou desconhecido vira recap", () => {
    expect(parseTab(undefined)).toBe("recap");
    expect(parseTab("xyz")).toBe("recap");
    expect(parseTab(["grade", "recap"])).toBe("grade");
  });
});

describe("userPageHref", () => {
  it("omite o que é padrão", () => {
    expect(userPageHref("rj", "recap")).toBe("/u/rj");
  });

  it("inclui aba, período e cartão quando informados", () => {
    expect(userPageHref("rj", "grade", "7day")).toBe("/u/rj?tab=grade&period=7day");
    expect(userPageHref("rj", "recap", "3month")).toBe("/u/rj?period=3month");
    expect(userPageHref("rj", "tops", "1month", "pt", "artists")).toBe("/u/rj?tab=tops&period=1month&card=artists");
  });
});
