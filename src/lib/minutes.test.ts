import { describe, expect, it } from "vitest";
import { estimateMinutes, FALLBACK_TRACK_SECONDS } from "./minutes";

describe("estimateMinutes", () => {
  it("média ponderada pelas vezes que cada música tocou", () => {
    // (3 x 200 s + 1 x 120 s) / 4 = 180 s por scrobble; 100 scrobbles = 300 min.
    const samples = [
      { plays: 3, durationSec: 200 },
      { plays: 1, durationSec: 120 },
    ];
    expect(estimateMinutes(100, samples)).toBe(300);
  });

  it("ignora música sem duração", () => {
    expect(estimateMinutes(10, [{ plays: 5, durationSec: 240 }, { plays: 50, durationSec: null }])).toBe(40);
  });

  it("sem nenhuma duração: usa a média padrão", () => {
    expect(estimateMinutes(60, [])).toBe(Math.round((60 * FALLBACK_TRACK_SECONDS) / 60));
  });

  it("sem scrobbles: zero", () => {
    expect(estimateMinutes(0, [{ plays: 1, durationSec: 200 }])).toBe(0);
  });
});
