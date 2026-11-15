import { describe, expect, it } from "vitest";
import { parseTab, userPageHref } from "./tabs";

describe("parseTab", () => {
  it("aceita as abas conhecidas", () => {
    expect(parseTab("grade")).toBe("grade");
    expect(parseTab("recap")).toBe("recap");
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

  it("inclui aba e período", () => {
    expect(userPageHref("rj", "grade", "7day")).toBe("/u/rj?tab=grade&period=7day");
    expect(userPageHref("rj", "recap", "3month")).toBe("/u/rj?period=3month");
  });
});
