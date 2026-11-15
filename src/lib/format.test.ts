import { describe, expect, it } from "vitest";
import { formatNumber, formatPlays, yearOf } from "./format";

describe("formatNumber", () => {
  it("usa ponto como separador de milhar", () => {
    expect(formatNumber(69921)).toBe("69.921");
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(7)).toBe("7");
  });
});

describe("formatPlays", () => {
  it("usa singular e plural", () => {
    expect(formatPlays(1)).toBe("1 reprodução");
    expect(formatPlays(25)).toBe("25 reproduções");
    expect(formatPlays(1500)).toBe("1.500 reproduções");
  });
});

describe("yearOf", () => {
  it("devolve o ano do cadastro", () => {
    expect(yearOf(1551562000)).toBe(2019);
  });

  it("devolve null para data ausente", () => {
    expect(yearOf(0)).toBeNull();
    expect(yearOf(Number.NaN)).toBeNull();
  });
});
