import { describe, expect, it } from "vitest";
import { AVATAR_ZONE, BANNER_W, bannerLayout, overlaps, SAFE_BOTTOM, SAFE_TOP } from "./layout";

describe("bannerLayout", () => {
  it("até 10 capas, em 2 fileiras de 5", () => {
    expect(bannerLayout(10).covers).toHaveLength(10);
    expect(bannerLayout(14).covers).toHaveLength(10);
    const rows = new Set(bannerLayout(10).covers.map((c) => c.y));
    expect(rows.size).toBe(2);
  });

  it("com até 5 capas, uma fileira só", () => {
    expect(new Set(bannerLayout(5).covers.map((c) => c.y)).size).toBe(1);
  });

  it.each([1, 5, 6, 10])("com %i capas: nada no canto do avatar nem fora da faixa segura", (n) => {
    const l = bannerLayout(n);
    for (const c of l.covers) {
      expect(overlaps(c, AVATAR_ZONE)).toBe(false);
      expect(c.y).toBeGreaterThanOrEqual(SAFE_TOP);
      expect(c.y + c.h).toBeLessThanOrEqual(SAFE_BOTTOM);
      expect(c.x + c.w).toBeLessThanOrEqual(BANNER_W);
    }
    // Textos acima do avatar e dentro da faixa segura.
    for (const t of [l.logo, l.title, l.subtitle]) {
      expect(t.baseline).toBeLessThan(AVATAR_ZONE.y);
      expect(t.baseline - t.fontPx).toBeGreaterThanOrEqual(SAFE_TOP);
    }
  });

  it("os textos não invadem as capas", () => {
    const l = bannerLayout(10);
    const firstCoverX = Math.min(...l.covers.map((c) => c.x));
    expect(l.title.x + l.title.maxWidth).toBeLessThan(firstCoverX);
  });
});
