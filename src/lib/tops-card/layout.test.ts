import { describe, expect, it } from "vitest";
import { computeTopsLayout, topsDimensions, TOPS_HEIGHT_SQUARE, TOPS_HEIGHT_STORIES, TOPS_WIDTH } from "./layout";

describe("tops-card/layout", () => {
  it("devolve dimensões lógicas e exportadas em 2x para Stories e Quadrado", () => {
    expect(topsDimensions("stories")).toEqual({
      width: 1080,
      height: 1920,
      exportWidth: 2160,
      exportHeight: 3840,
    });
    expect(topsDimensions("square")).toEqual({
      width: 1080,
      height: 1080,
      exportWidth: 2160,
      exportHeight: 2160,
    });
  });

  it("Artistas (Stories e Quadrado, Top 5 e Top 10) respeita o rodapé e centraliza os sulcos no #01", () => {
    const s5 = computeTopsLayout({ kind: "artists", format: "stories", targetCount: 5, actualCount: 5 });
    expect(s5.kind).toBe("artists");
    if (s5.kind !== "artists") return;
    expect(s5.masthead.height).toBe(TOPS_HEIGHT_STORIES);
    expect(s5.rows).toHaveLength(4);
    expect(s5.grooves.cx).toBe(s5.hero.circleX + s5.hero.circleDia / 2);
    expect(s5.rows.at(-1)!.y + s5.rows.at(-1)!.h).toBeLessThan(s5.masthead.footerTop);

    const s10 = computeTopsLayout({ kind: "artists", format: "stories", targetCount: 10, actualCount: 10 });
    expect(s10.kind).toBe("artists");
    if (s10.kind !== "artists") return;
    expect(s10.rows).toHaveLength(9);
    expect(s10.rows[0].artSide).toBeGreaterThanOrEqual(80);
    expect(s10.rows[1].y - (s10.rows[0].y + s10.rows[0].artSide)).toBeGreaterThanOrEqual(18);
    expect(s10.rows.at(-1)!.y + s10.rows.at(-1)!.h).toBeLessThan(s10.masthead.footerTop);

    const q10 = computeTopsLayout({ kind: "artists", format: "square", targetCount: 10, actualCount: 10 });
    expect(q10.kind).toBe("artists");
    if (q10.kind !== "artists") return;
    expect(q10.masthead.width).toBe(TOPS_WIDTH);
    expect(q10.masthead.height).toBe(TOPS_HEIGHT_SQUARE);
    expect(q10.gridCells).toHaveLength(9);
    expect(q10.gridCells[0].horizontal).toBe(true);
    expect(q10.gridCells.at(-1)!.y + q10.gridCells.at(-1)!.h).toBeLessThan(q10.masthead.footerTop);
  });

  it("Álbuns posiciona disco de vinil saindo de trás da capa #01 e respeita o rodapé", () => {
    const s5 = computeTopsLayout({ kind: "albums", format: "stories", targetCount: 5, actualCount: 5 });
    expect(s5.kind).toBe("albums");
    if (s5.kind !== "albums") return;
    expect(s5.hero.vinylX).toBeGreaterThan(s5.hero.coverX);
    expect(s5.rows).toHaveLength(4);
    expect(s5.rows.at(-1)!.y + s5.rows.at(-1)!.h).toBeLessThan(s5.masthead.footerTop);

    const q5 = computeTopsLayout({ kind: "albums", format: "square", targetCount: 5, actualCount: 5 });
    expect(q5.kind).toBe("albums");
    if (q5.kind !== "albums") return;
    expect(q5.cells).toHaveLength(4);
    expect(q5.cells[0].horizontal).toBe(true);
    expect(q5.cells.at(-1)!.y + q5.cells.at(-1)!.h).toBeLessThan(q5.masthead.footerTop);

    const q10 = computeTopsLayout({ kind: "albums", format: "square", targetCount: 10, actualCount: 10 });
    expect(q10.kind).toBe("albums");
    if (q10.kind !== "albums") return;
    expect(q10.cells).toHaveLength(9);
    expect(q10.cells.at(-1)!.y + q10.cells.at(-1)!.h).toBeLessThan(q10.masthead.footerTop);
  });

  it("Músicas remove miniaturas repetidas e respeita o rodapé", () => {
    const s5 = computeTopsLayout({ kind: "tracks", format: "stories", targetCount: 5, actualCount: 5 });
    expect(s5.kind).toBe("tracks");
    if (s5.kind !== "tracks") return;
    expect(s5.hero.coverSide).toBe(500);
    expect(s5.rows).toHaveLength(4);
    expect(s5.rows.every((r) => r.artSide === 0)).toBe(true);
    expect(s5.rows.at(-1)!.y + s5.rows.at(-1)!.h).toBeLessThan(s5.masthead.footerTop);

    const q5 = computeTopsLayout({ kind: "tracks", format: "square", targetCount: 5, actualCount: 5 });
    expect(q5.kind).toBe("tracks");
    if (q5.kind !== "tracks") return;
    expect(q5.rows).toHaveLength(4);
    expect(q5.rows.at(-1)!.y + q5.rows.at(-1)!.h).toBeLessThan(q5.masthead.footerTop);
  });

  it("Gêneros usa o mesmo comprimento de trilho de barra para todas as linhas #02-#05", () => {
    for (const format of ["stories", "square"] as const) {
      const layout = computeTopsLayout({ kind: "genres", format, targetCount: 5, actualCount: 5 });
      expect(layout.kind).toBe("genres");
      if (layout.kind !== "genres") return;
      expect(layout.rows).toHaveLength(4);
      const widths = new Set(layout.rows.map((r) => r.barW));
      expect(widths.size).toBe(1);
      expect(layout.rows.at(-1)!.y + layout.rows.at(-1)!.h).toBeLessThan(layout.masthead.footerTop);
    }
  });
});
