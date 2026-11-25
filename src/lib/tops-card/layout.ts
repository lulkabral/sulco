// Geometria pura dos 4 pôsteres da aba Tops (Artistas, Álbuns, Músicas e Gêneros)
// nos formatos Stories (9:16, 1080×1920) e Quadrado (1:1, 1080×1080), Top 5 e Top 10, em 2×.

import type { TopsCardCount, TopsCardFormat, TopsCardKind } from "./prefs";

export const TOPS_SCALE = 2;
export const TOPS_WIDTH = 1080;
export const TOPS_HEIGHT_STORIES = 1920;
export const TOPS_HEIGHT_SQUARE = 1080;

export type Rect = { x: number; y: number; w: number; h: number };

export type GroovesSpec = {
  cx: number;
  cy: number;
  startR: number;
  fadeR: number;
};

export type MastheadLayout = {
  width: number;
  height: number;
  margin: number;
  inner: number;
  headTop: number;
  metaY: number;
  ruleY: number;
  titleTop: number;
  titleY: number;
  titleSize: number;
  periodY: number;
  periodH: number;
  contentTop: number;
  contentBottom: number;
  footerTop: number;
  footerH: number;
};

export type ListSlot = Rect & {
  rank: number;
  artSide: number;
  large: boolean;
  compact: boolean;
};

export type GalleryCell = Rect & {
  rank: number;
  artSide: number;
  /** True = layout horizontal (capa à esquerda + texto à direita); false = vertical (foto em cima + texto abaixo). */
  horizontal: boolean;
  compact: boolean;
};

export type GenreRow = Rect & {
  rank: number;
  barW: number;
  circleDia: number;
};

export type TopsLayout =
  | {
      kind: "artists";
      masthead: MastheadLayout;
      grooves: GroovesSpec;
      hero: {
        textX: number;
        textY: number;
        textW: number;
        textH: number;
        circleX: number;
        circleY: number;
        circleDia: number;
      };
      sectionLabelY: number;
      rows: ListSlot[];
      gridCells: GalleryCell[];
    }
  | {
      kind: "albums";
      masthead: MastheadLayout;
      grooves: GroovesSpec;
      hero: {
        coverX: number;
        coverY: number;
        coverSide: number;
        vinylX: number;
        vinylY: number;
        vinylDia: number;
        textX: number;
        textY: number;
        textW: number;
        textH: number;
      };
      sectionLabelY: number;
      rows: ListSlot[];
      cells: GalleryCell[];
    }
  | {
      kind: "tracks";
      masthead: MastheadLayout;
      grooves: GroovesSpec;
      hero: {
        coverX: number;
        coverY: number;
        coverSide: number;
        textX: number;
        textY: number;
        textW: number;
        textH: number;
      };
      sectionLabelY: number;
      rows: ListSlot[];
    }
  | {
      kind: "genres";
      masthead: MastheadLayout;
      grooves: GroovesSpec;
      hero: Rect & { circleDia: number };
      sectionLabelY: number;
      rows: GenreRow[];
    };

export function topsDimensions(format: TopsCardFormat) {
  const height = format === "stories" ? TOPS_HEIGHT_STORIES : TOPS_HEIGHT_SQUARE;
  return {
    width: TOPS_WIDTH,
    height,
    exportWidth: TOPS_WIDTH * TOPS_SCALE,
    exportHeight: height * TOPS_SCALE,
  };
}

function buildMasthead(format: TopsCardFormat): MastheadLayout {
  const { width, height } = topsDimensions(format);
  const stories = format === "stories";
  const margin = stories ? 72 : 60;
  const inner = width - margin * 2;
  const headTop = stories ? 96 : 44;
  const headH = stories ? 56 : 42;
  const metaY = headTop + (stories ? 26 : 20);
  const ruleY = headTop + headH;
  const titleTop = stories ? 168 : 100;
  const titleSize = stories ? 112 : 74;
  const titleY = titleTop + Math.round(titleSize * 0.82);
  const periodY = stories ? 304 : 186;
  const periodH = stories ? 54 : 40;
  const footerBottom = stories ? 96 : 38;
  const footerH = stories ? 64 : 52;
  const footerTop = height - footerBottom - footerH;
  return {
    width,
    height,
    margin,
    inner,
    headTop,
    metaY,
    ruleY,
    titleTop,
    titleY,
    titleSize,
    periodY,
    periodH,
    contentTop: stories ? 400 : 246,
    contentBottom: footerTop - (stories ? 22 : 16),
    footerTop,
    footerH,
  };
}

/**
 * Calcula posições exatas para os 4 pôsteres (Stories e Quadrado, Top 5 e Top 10)
 * sem colisões e sempre respeitando a margem do rodapé.
 */
export function computeTopsLayout(opts: {
  kind: TopsCardKind;
  format: TopsCardFormat;
  targetCount: TopsCardCount;
  actualCount: number;
}): TopsLayout {
  const m = buildMasthead(opts.format);
  const stories = opts.format === "stories";

  // ---------------- GÊNEROS (sempre Top 5, trilho de barra fixo e alinhado) ----------------
  if (opts.kind === "genres") {
    const rest = Math.max(0, Math.min(opts.actualCount, 5) - 1);
    if (stories) {
      const hero: Rect & { circleDia: number } = { x: m.margin, y: 400, w: m.inner, h: 420, circleDia: 170 };
      const sectionLabelY = 858;
      const listTop = 910;
      const rowH = 206;
      const rows: GenreRow[] = Array.from({ length: rest }, (_, i) => ({
        rank: i + 2,
        x: m.margin,
        y: listTop + i * rowH,
        w: m.inner,
        h: rowH,
        barW: 560,
        circleDia: 110,
      }));
      return {
        kind: "genres",
        masthead: m,
        grooves: { cx: 900, cy: 520, startR: 230, fadeR: 1150 },
        hero,
        sectionLabelY,
        rows,
      };
    }

    // Quadrado Gêneros
    const hero: Rect & { circleDia: number } = { x: m.margin, y: 246, w: m.inner, h: 224, circleDia: 112 };
    const sectionLabelY = 492;
    const listTop = 530;
    const rowH = rest > 0 ? Math.min(108, Math.floor((m.contentBottom - listTop) / rest)) : 0;
    const rows: GenreRow[] = Array.from({ length: rest }, (_, i) => ({
      rank: i + 2,
      x: m.margin,
      y: listTop + i * rowH,
      w: m.inner,
      h: rowH,
      barW: 570,
      circleDia: 74,
    }));
    return {
      kind: "genres",
      masthead: m,
      grooves: { cx: 880, cy: 358, startR: 160, fadeR: 780 },
      hero,
      sectionLabelY,
      rows,
    };
  }

  const n = Math.min(opts.actualCount, opts.targetCount);
  const restCount = Math.max(0, n - 1);
  const isFive = opts.targetCount === 5;

  // ---------------- ARTISTAS (Top 5 lista com barras proporcionais; Top 10 galeria 3×3 espaçosa) ----------------
  if (opts.kind === "artists") {
    if (stories) {
      if (isFive) {
        const circleDia = 340;
        const circleX = 668;
        const circleY = 410;
        const sectionLabelY = 800;
        const listTop = 852;
        const rowH = 214;
        const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
          rank: i + 2,
          x: m.margin,
          y: listTop + i * rowH,
          w: m.inner,
          h: rowH,
          artSide: 156,
          large: true,
          compact: false,
        }));
        return {
          kind: "artists",
          masthead: m,
          grooves: { cx: circleX + circleDia / 2, cy: circleY + circleDia / 2, startR: 190, fadeR: 1150 },
          hero: { textX: m.margin, textY: 400, textW: 590, textH: 360, circleX, circleY, circleDia },
          sectionLabelY,
          rows,
          gridCells: [],
        };
      }

      // Stories Top 10 Artistas: lista vertical no mesmo ritmo do Top 5, com fotos grandes e respiro entre elas
      const circleDia = 276;
      const circleX = m.margin + m.inner - circleDia;
      const circleY = 398;
      const sectionLabelY = 708;
      const listTop = 752;
      const rowH = restCount > 0 ? Math.min(109, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
      const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
        rank: i + 2,
        x: m.margin,
        y: listTop + i * rowH,
        w: m.inner,
        h: rowH,
        artSide: Math.min(88, Math.max(72, rowH - 21)),
        large: false,
        compact: true,
      }));
      return {
        kind: "artists",
        masthead: m,
        grooves: { cx: circleX + circleDia / 2, cy: circleY + circleDia / 2, startR: 162, fadeR: 1150 },
        hero: { textX: m.margin, textY: 396, textW: 616, textH: 280, circleX, circleY, circleDia },
        sectionLabelY,
        rows,
        gridCells: [],
      };
    }

    // Quadrado Artistas
    if (isFive) {
      const circleDia = 216;
      const circleX = m.margin + m.inner - circleDia;
      const circleY = 250;
      const sectionLabelY = 490;
      const listTop = 528;
      const rowH = restCount > 0 ? Math.min(108, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
      const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
        rank: i + 2,
        x: m.margin,
        y: listTop + i * rowH,
        w: m.inner,
        h: rowH,
        artSide: 90,
        large: true,
        compact: false,
      }));
      return {
        kind: "artists",
        masthead: m,
        grooves: { cx: circleX + circleDia / 2, cy: circleY + circleDia / 2, startR: 130, fadeR: 760 },
        hero: { textX: m.margin, textY: 246, textW: 690, textH: 224, circleX, circleY, circleDia },
        sectionLabelY,
        rows,
        gridCells: [],
      };
    }

    // Quadrado Top 10 Artistas: 2 colunas horizontais espaçosas (#02–#06 à esquerda, #07–#10 à direita)
    const circleDia = 186;
    const circleX = m.margin + m.inner - circleDia;
    const circleY = 246;
    const sectionLabelY = 454;
    const gridTop = 492;
    const gridH = m.contentBottom - gridTop;
    const colGap = 44;
    const rowGap = 14;
    const leftCount = Math.ceil(restCount / 2); // 5 na esquerda, 4 na direita
    const cellW = Math.floor((m.inner - colGap) / 2);
    const cellH = leftCount > 0 ? Math.floor((gridH - rowGap * (leftCount - 1)) / leftCount) : 0;
    const artSide = Math.min(74, Math.max(60, cellH - 12));
    const gridCells: GalleryCell[] = Array.from({ length: restCount }, (_, i) => {
      const col = i < leftCount ? 0 : 1;
      const row = col === 0 ? i : i - leftCount;
      return {
        rank: i + 2,
        x: m.margin + col * (cellW + colGap),
        y: gridTop + row * (cellH + rowGap),
        w: cellW,
        h: cellH,
        artSide,
        horizontal: true,
        compact: true,
      };
    });
    return {
      kind: "artists",
      masthead: m,
      grooves: { cx: circleX + circleDia / 2, cy: circleY + circleDia / 2, startR: 118, fadeR: 740 },
      hero: { textX: m.margin, textY: 246, textW: 720, textH: 190, circleX, circleY, circleDia },
      sectionLabelY,
      rows: [],
      gridCells,
    };
  }

  // ---------------- ÁLBUNS (capa #01 com disco de vinil saindo por trás + insight %) ----------------
  if (opts.kind === "albums") {
    if (stories) {
      if (isFive) {
        const coverSide = 420;
        const coverX = m.margin;
        const coverY = 410;
        const vinylDia = 400;
        const vinylX = 212;
        const vinylY = 420;
        const sectionLabelY = 866;
        const listTop = 916;
        const rowH = 184;
        const rowGap = 20;
        const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
          rank: i + 2,
          x: m.margin,
          y: listTop + i * (rowH + rowGap),
          w: m.inner,
          h: rowH,
          artSide: 184,
          large: true,
          compact: false,
        }));
        return {
          kind: "albums",
          masthead: m,
          grooves: { cx: vinylX + vinylDia / 2, cy: vinylY + vinylDia / 2, startR: 150, fadeR: 1150 },
          hero: {
            coverX,
            coverY,
            coverSide,
            vinylX,
            vinylY,
            vinylDia,
            textX: 650,
            textY: 410,
            textW: 358,
            textH: 420,
          },
          sectionLabelY,
          rows,
          cells: [],
        };
      }

      // Stories Top 10 Álbuns: #01 com disco de vinil + grade 3×3 espaçosa
      const coverSide = 356;
      const coverX = m.margin;
      const coverY = 400;
      const vinylDia = 340;
      const vinylX = 192;
      const vinylY = 408;
      const sectionLabelY = 792;
      const gridTop = 840;
      const gridH = m.contentBottom - gridTop;
      const colGap = 28;
      const rowGap = 20;
      const cellW = Math.floor((m.inner - colGap * 2) / 3);
      const cellH = Math.floor((gridH - rowGap * 2) / 3);
      const artSide = Math.min(208, cellW, Math.max(150, cellH - 76));
      const cells: GalleryCell[] = Array.from({ length: restCount }, (_, i) => ({
        rank: i + 2,
        x: m.margin + (i % 3) * (cellW + colGap),
        y: gridTop + Math.floor(i / 3) * (cellH + rowGap),
        w: cellW,
        h: cellH,
        artSide,
        horizontal: false,
        compact: true,
      }));
      return {
        kind: "albums",
        masthead: m,
        grooves: { cx: vinylX + vinylDia / 2, cy: vinylY + vinylDia / 2, startR: 140, fadeR: 1150 },
        hero: {
          coverX,
          coverY,
          coverSide,
          vinylX,
          vinylY,
          vinylDia,
          textX: 566,
          textY: 400,
          textW: 442,
          textH: 356,
        },
        sectionLabelY,
        rows: [],
        cells,
      };
    }

    // Quadrado Álbuns
    if (isFive) {
      const coverSide = 250;
      const coverX = m.margin;
      const coverY = 250;
      const vinylDia = 240;
      const vinylX = 160;
      const vinylY = 255;
      const sectionLabelY = 532;
      const gridTop = 574;
      const gridH = m.contentBottom - gridTop;
      const colGap = 28;
      const rowGap = 20;
      const cellW = Math.floor((m.inner - colGap) / 2);
      const cellH = Math.floor((gridH - rowGap) / 2);
      const artSide = Math.min(168, cellH);
      const cells: GalleryCell[] = Array.from({ length: restCount }, (_, i) => ({
        rank: i + 2,
        x: m.margin + (i % 2) * (cellW + colGap),
        y: gridTop + Math.floor(i / 2) * (cellH + rowGap),
        w: cellW,
        h: cellH,
        artSide,
        horizontal: true,
        compact: false,
      }));
      return {
        kind: "albums",
        masthead: m,
        grooves: { cx: vinylX + vinylDia / 2, cy: vinylY + vinylDia / 2, startR: 120, fadeR: 760 },
        hero: {
          coverX,
          coverY,
          coverSide,
          vinylX,
          vinylY,
          vinylDia,
          textX: 432,
          textY: 248,
          textW: 588,
          textH: 254,
        },
        sectionLabelY,
        rows: [],
        cells,
      };
    }

    // Quadrado Top 10 Álbuns: #01 com vinil no topo + grade 3×3 horizontal compacta
    const coverSide = 212;
    const coverX = m.margin;
    const coverY = 248;
    const vinylDia = 204;
    const vinylX = 146;
    const vinylY = 252;
    const sectionLabelY = 486;
    const gridTop = 524;
    const gridH = m.contentBottom - gridTop;
    const colGap = 20;
    const rowGap = 14;
    const cellW = Math.floor((m.inner - colGap * 2) / 3);
    const cellH = Math.floor((gridH - rowGap * 2) / 3);
    const artSide = Math.min(122, cellH);
    const cells: GalleryCell[] = Array.from({ length: restCount }, (_, i) => ({
      rank: i + 2,
      x: m.margin + (i % 3) * (cellW + colGap),
      y: gridTop + Math.floor(i / 3) * (cellH + rowGap),
      w: cellW,
      h: cellH,
      artSide,
      horizontal: true,
      compact: true,
    }));
    return {
      kind: "albums",
      masthead: m,
      grooves: { cx: vinylX + vinylDia / 2, cy: vinylY + vinylDia / 2, startR: 110, fadeR: 740 },
      hero: {
        coverX,
        coverY,
        coverSide,
        vinylX,
        vinylY,
        vinylDia,
        textX: 382,
        textY: 246,
        textW: 638,
        textH: 216,
      },
      sectionLabelY,
      rows: [],
      cells,
    };
  }

  // ---------------- MÚSICAS (sem miniaturas repetidas, lista limpa com barras) ----------------
  if (stories) {
    if (isFive) {
      const coverSide = 500;
      const coverX = m.margin;
      const coverY = 404;
      const sectionLabelY = 958;
      const listTop = 1016;
      const rowH = restCount > 0 ? Math.min(176, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
      const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
        rank: i + 2,
        x: m.margin,
        y: listTop + i * rowH,
        w: m.inner,
        h: rowH,
        artSide: 0,
        large: true,
        compact: false,
      }));
      return {
        kind: "tracks",
        masthead: m,
        grooves: { cx: 322, cy: 654, startR: 260, fadeR: 1150 },
        hero: { coverX, coverY, coverSide, textX: 608, textY: 404, textW: 400, textH: 500 },
        sectionLabelY,
        rows,
      };
    }

    // Stories Top 10 Músicas
    const coverSide = 360;
    const coverX = m.margin;
    const coverY = 400;
    const sectionLabelY = 800;
    const listTop = 842;
    const rowH = restCount > 0 ? Math.min(98, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
    const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
      rank: i + 2,
      x: m.margin,
      y: listTop + i * rowH,
      w: m.inner,
      h: rowH,
      artSide: 0,
      large: false,
      compact: true,
    }));
    return {
      kind: "tracks",
      masthead: m,
      grooves: { cx: coverX + coverSide / 2, cy: coverY + coverSide / 2, startR: 200, fadeR: 1150 },
      hero: { coverX, coverY, coverSide, textX: 468, textY: 400, textW: 540, textH: 360 },
      sectionLabelY,
      rows,
    };
  }

  // Quadrado Músicas
  if (isFive) {
    const coverSide = 248;
    const coverX = m.margin;
    const coverY = 248;
    const sectionLabelY = 524;
    const listTop = 562;
    const rowH = restCount > 0 ? Math.min(102, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
    const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
      rank: i + 2,
      x: m.margin,
      y: listTop + i * rowH,
      w: m.inner,
      h: rowH,
      artSide: 0,
      large: true,
      compact: false,
    }));
    return {
      kind: "tracks",
      masthead: m,
      grooves: { cx: coverX + coverSide / 2, cy: coverY + coverSide / 2, startR: 140, fadeR: 760 },
      hero: { coverX, coverY, coverSide, textX: 338, textY: 248, textW: 682, textH: 248 },
      sectionLabelY,
      rows,
    };
  }

  // Quadrado Top 10 Músicas
  const coverSide = 186;
  const coverX = m.margin;
  const coverY = 248;
  const sectionLabelY = 454;
  const listTop = 488;
  const rowH = restCount > 0 ? Math.min(54, Math.floor((m.contentBottom - listTop) / restCount)) : 0;
  const rows: ListSlot[] = Array.from({ length: restCount }, (_, i) => ({
    rank: i + 2,
    x: m.margin,
    y: listTop + i * rowH,
    w: m.inner,
    h: rowH,
    artSide: 0,
    large: false,
    compact: true,
  }));
  return {
    kind: "tracks",
    masthead: m,
    grooves: { cx: coverX + coverSide / 2, cy: coverY + coverSide / 2, startR: 118, fadeR: 720 },
    hero: { coverX, coverY, coverSide, textX: 274, textY: 248, textW: 746, textH: 186 },
    sectionLabelY,
    rows,
  };
}
