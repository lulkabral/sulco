import { describe, expect, it } from "vitest";
import { formatDateRange, formatNumber, formatPlays, formatSince, yearOf } from "./format";

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

describe("formatDateRange", () => {
  const tz = "America/Sao_Paulo";
  // 15/11/2026 12:00 em São Paulo (15:00 UTC)
  const nov15 = Date.UTC(2026, 10, 15, 15) / 1000;
  const day = 86_400;

  it("mesmo mês: só o dia no começo", () => {
    expect(formatDateRange(nov15 - 7 * day, nov15, tz)).toBe("8 – 15 nov 2026");
  });

  it("meses diferentes no mesmo ano", () => {
    expect(formatDateRange(nov15 - 30 * day, nov15, tz)).toBe("16 out – 15 nov 2026");
  });

  it("anos diferentes", () => {
    expect(formatDateRange(nov15 - 365 * day, nov15, tz)).toBe("15 nov 2025 – 15 nov 2026");
  });

  it("usa o fuso: 01:00 UTC ainda é o dia anterior em São Paulo", () => {
    const utc = Date.UTC(2026, 10, 15, 1) / 1000;
    expect(formatDateRange(utc - 7 * day, utc, tz)).toBe("7 – 14 nov 2026");
  });
});

describe("formatSince", () => {
  it("mês por extenso e ano", () => {
    expect(formatSince(Date.UTC(2019, 2, 10, 15) / 1000, "America/Sao_Paulo")).toBe("desde março de 2019");
  });
});

describe("formatação em outras línguas", () => {
  it("números e reproduções", () => {
    expect(formatNumber(69921, "en")).toBe("69,921");
    expect(formatPlays(25, "en")).toBe("25 plays");
    expect(formatPlays(1, "es")).toBe("1 reproducción");
  });
  it("datas", () => {
    const tz = "America/Sao_Paulo";
    const from = Date.UTC(2026, 9, 16, 15) / 1000;
    const to = Date.UTC(2026, 10, 15, 15) / 1000;
    expect(formatDateRange(from, to, tz, "en")).toBe("16 Oct – 15 Nov 2026");
    expect(formatDateRange(from, to, tz, "es")).toBe("16 oct – 15 nov 2026");
    expect(formatSince(Date.UTC(2019, 2, 10, 15) / 1000, tz, "en")).toBe("since March 2019");
    expect(formatSince(Date.UTC(2019, 2, 10, 15) / 1000, tz, "es")).toBe("desde marzo de 2019");
  });
});
