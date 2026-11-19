import { describe, expect, it } from "vitest";
import { oppositeTheme, parseThemeMode, resolveThemeMode } from "./theme-mode";

describe("theme-mode", () => {
  it("aceita apenas 'light' ou 'dark'", () => {
    expect(parseThemeMode("light")).toBe("light");
    expect(parseThemeMode("dark")).toBe("dark");
    expect(parseThemeMode(null)).toBeNull();
    expect(parseThemeMode(undefined)).toBeNull();
    expect(parseThemeMode("sepia")).toBeNull();
  });

  it("segue o aparelho quando não há escolha salva", () => {
    expect(resolveThemeMode(null, false)).toBe("light");
    expect(resolveThemeMode(null, true)).toBe("dark");
  });

  it("a escolha salva vence o tema do aparelho", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });

  it("alterna entre claro e escuro", () => {
    expect(oppositeTheme("light")).toBe("dark");
    expect(oppositeTheme("dark")).toBe("light");
  });
});
