import { afterEach, describe, expect, it } from "vitest";
import { lastClosedMonths, monthLabel, monthRange, parseMonthId } from "./months";

describe("parseMonthId", () => {
  it("aceita AAAA-MM", () => {
    expect(parseMonthId("2026-10")).toEqual({ year: 2026, month: 10 });
    expect(parseMonthId("2025-01")).toEqual({ year: 2025, month: 1 });
  });

  it.each([undefined, null, "", "2026-13", "2026-00", "2026-1", "26-10", "1999-05", "7day"])(
    "recusa %s",
    (raw) => {
      expect(parseMonthId(raw)).toBeNull();
    },
  );
});

describe("lastClosedMonths", () => {
  it("12 meses fechados, do mais recente para o mais antigo", () => {
    const months = lastClosedMonths(new Date(Date.UTC(2026, 10, 15)));
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2026-10");
    expect(months[9]).toBe("2026-01");
    expect(months[10]).toBe("2025-12");
    expect(months[11]).toBe("2025-11");
  });

  it("em janeiro, o primeiro é dezembro do ano anterior", () => {
    expect(lastClosedMonths(new Date(Date.UTC(2027, 0, 3)), 2)).toEqual(["2026-12", "2026-11"]);
  });
});

describe("monthLabel", () => {
  it("nome do mês com maiúscula e ano", () => {
    expect(monthLabel("2026-10")).toBe("Outubro de 2026");
    expect(monthLabel("2026-03")).toBe("Março de 2026");
    expect(monthLabel("xx")).toBe("");
  });
});

describe("monthRange", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("usa o fuso do aparelho (São Paulo, UTC-3)", () => {
    process.env.TZ = "America/Sao_Paulo";
    expect(monthRange("2026-10")).toEqual({
      from: Date.UTC(2026, 9, 1, 3) / 1000,
      to: Date.UTC(2026, 10, 1, 3) / 1000 - 1,
    });
  });

  it("em outro fuso, o mesmo mês começa em outra hora (Tóquio, UTC+9)", () => {
    process.env.TZ = "Asia/Tokyo";
    expect(monthRange("2026-10")?.from).toBe(Date.UTC(2026, 8, 30, 15) / 1000);
  });

  it("fevereiro de ano bissexto tem 29 dias", () => {
    process.env.TZ = "UTC";
    const r = monthRange("2028-02")!;
    expect((r.to + 1 - r.from) / 86_400).toBe(29);
  });

  it("mês inválido -> null", () => {
    expect(monthRange("2026-13")).toBeNull();
  });
});
