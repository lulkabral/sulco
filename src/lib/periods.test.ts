import { describe, expect, it } from "vitest";
import { DEFAULT_UI_PERIOD, parseUiPeriod, periodLabel } from "./periods";

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
