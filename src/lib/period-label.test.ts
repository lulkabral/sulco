import { describe, expect, it } from "vitest";
import { shortPeriodLabel } from "./period-label";

describe("shortPeriodLabel", () => {
  it("períodos do Last.fm", () => {
    expect(shortPeriodLabel("1month", 2026)).toBe("30 dias");
    expect(shortPeriodLabel("overall", 2026)).toBe("Todo o tempo");
  });

  it("mês fechado", () => {
    expect(shortPeriodLabel("2026-10", 2026)).toBe("out 2026");
    expect(shortPeriodLabel("2019-01", 2026)).toBe("jan 2019");
  });

  it("ano: o corrente é 'até agora'", () => {
    expect(shortPeriodLabel("2026", 2026)).toBe("2026 até agora");
    expect(shortPeriodLabel("2025", 2026)).toBe("2025");
  });
});
