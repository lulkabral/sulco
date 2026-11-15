import { describe, expect, it } from "vitest";
import { DEFAULT_UI_PERIOD, parseUiPeriod, periodLabel, periodRange } from "./periods";

describe("parseUiPeriod", () => {
  it("aceita os períodos da tela", () => {
    expect(parseUiPeriod("7day")).toBe("7day");
    expect(parseUiPeriod("12month")).toBe("12month");
  });

  it("usa o padrão (30 dias) quando vem vazio ou desconhecido", () => {
    expect(DEFAULT_UI_PERIOD).toBe("1month");
    expect(parseUiPeriod(undefined)).toBe("1month");
    expect(parseUiPeriod("2day")).toBe("1month");
    expect(parseUiPeriod("overall")).toBe("1month");
  });

  it("aceita outro padrão (o da aba Grade)", () => {
    expect(parseUiPeriod(undefined, "7day")).toBe("7day");
    expect(parseUiPeriod("3month", "7day")).toBe("3month");
  });

  it("pega o primeiro valor quando o parâmetro se repete", () => {
    expect(parseUiPeriod(["3month", "7day"])).toBe("3month");
  });
});

describe("periodLabel", () => {
  it("devolve o rótulo em português", () => {
    expect(periodLabel("1month")).toBe("Últimos 30 dias");
  });
});

describe("periodRange", () => {
  it("termina no bloco de 10 min e volta o número de dias do período", () => {
    const now = 1_794_600_123; // 13/11/2026, alguns segundos depois de um bloco
    const { from, to } = periodRange("7day", now);
    expect(to).toBe(1_794_600_000);
    expect(to - from).toBe(7 * 86_400);
  });

  it("30 dias para 1month e 365 para 12month", () => {
    const now = 1_794_600_000;
    expect(now - periodRange("1month", now).from).toBe(30 * 86_400);
    expect(now - periodRange("12month", now).from).toBe(365 * 86_400);
  });

  it("chamadas no mesmo bloco dão o mesmo intervalo (cache)", () => {
    expect(periodRange("7day", 1_794_600_001)).toEqual(periodRange("7day", 1_794_600_599));
  });
});
