// Desenho dos 4 cards compartilháveis da aba Tops (Artistas, Álbuns, Músicas e Gêneros)
// nos formatos Stories (9:16) e Quadrado (1:1), Top 5 e Top 10, em 2×.

import type { Locale } from "@/i18n/config";
import { DICTS } from "@/i18n";
import { formatNumber, formatPlays } from "@/lib/format";
import { wrapText } from "@/lib/canvas/text";
import { contrastRatio, type Palette } from "@/lib/recap/palettes";
import {
  cover,
  fitFontSize,
  hexAlpha,
  measureWith,
  roundRect,
  text,
  type Ctx,
} from "@/lib/recap/helpers";
import {
  computeTopsLayout,
  TOPS_SCALE,
  type GalleryCell,
  type GenreRow,
  type GroovesSpec,
  type MastheadLayout,
  type TopsLayout,
} from "./layout";
import type { TopsCardCount, TopsCardFormat, TopsCardKind } from "./prefs";

/** Cor âmbar exclusiva para o selo "Nº 01" e o disco do logo. */
const AMBER = "#E8A13A";
const DARK_ON_AMBER = "#0E1613";

export type TopsCardItem = {
  rank: number;
  name: string;
  /** Artista (para músicas e álbuns). */
  detail?: string;
  playcount: number;
  image: HTMLImageElement | null;
};

export type TopsCardGenre = {
  name: string;
  weight: number;
  artists: string[];
  /** Fotos dos artistas contribuintes (até 3). */
  artistImages: (HTMLImageElement | null)[];
};

export type TopsCardData = {
  username: string;
  periodLabel: string;
  items: TopsCardItem[];
  genres: TopsCardGenre[];
  siteHost: string;
  /** Porcentagem das reproduções do artista #01 que vieram do disco #01 (card de Álbuns). */
  albumArtistSharePct?: number | null;
};

export type TopsCardOptions = {
  kind: TopsCardKind;
  format: TopsCardFormat;
  count: TopsCardCount;
  palette: Palette;
  showNumbers: boolean;
  showUsername: boolean;
  /** Cor do vinil colorido no card de Álbuns, ou null para o disco preto clássico. */
  vinylColor?: string | null;
  font: string;
  lang: Locale;
  scale?: number;
};

function hairline(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 1.5) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

/**
 * Escolhe o maior tamanho de fonte que cabe em até `maxLines` linhas sem truncar com reticências
 * nem estourar uma única palavra além de `maxW`.
 */
function fitWrappedFontSize(
  ctx: Ctx,
  str: string,
  maxW: number,
  maxLines: number,
  maxPx: number,
  minPx: number,
  fontFn: (px: number) => string,
): { size: number; lines: string[] } {
  const words = str.trim().split(/\s+/).filter(Boolean);
  for (let px = maxPx; px >= minPx; px -= 2) {
    ctx.font = fontFn(px);
    const measure = measureWith(ctx);
    const fitsAllWords = words.every((w) => measure(w) <= maxW);
    const lines = wrapText(str, maxW, maxLines, measure);
    const truncated = lines.length > 0 && lines[lines.length - 1].endsWith("…") && !str.trim().endsWith("…");
    if (fitsAllWords && !truncated) return { size: px, lines };
  }
  ctx.font = fontFn(minPx);
  return { size: minPx, lines: wrapText(str, maxW, maxLines, measureWith(ctx)) };
}

/**
 * Motivo de sulcos concêntricos centrado no item nº 01, esmaecendo radialmente para fora.
 */
function drawCenteredGrooves(ctx: Ctx, w: number, h: number, spec: GroovesSpec, p: Palette) {
  const { cx, cy, startR, fadeR } = spec;
  const step = 46;
  const midFadeR = fadeR * 0.35;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  for (let i = 0; i < 44; i++) {
    const r = startR + i * step;
    if (r >= fadeR) break;
    const fade =
      r <= midFadeR
        ? 1 - 0.15 * (r / midFadeR)
        : Math.max(0, 0.85 * (1 - (r - midFadeR) / (fadeR - midFadeR)));
    if (fade <= 0.01) continue;
    const major = i % 4 === 0;
    const baseAlpha = major ? 0.2 : 0.085;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(p.accent, baseAlpha * fade);
    ctx.lineWidth = major ? 2 : 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

/** Selo inclinado -3°: âmbar com texto escuro (padrão) ou escuro com texto âmbar (no cartão de Gêneros). */
function drawNumberOneChip(
  ctx: Ctx,
  label: string,
  x: number,
  y: number,
  f: string,
  stories: boolean,
  inverted = false,
): number {
  const fontSize = stories ? 28 : 21;
  const padX = stories ? 22 : 16;
  const padY = stories ? 12 : 9;
  const spacing = fontSize * 0.16;

  ctx.save();
  ctx.font = `800 ${fontSize}px ${f}`;
  ctx.letterSpacing = `${spacing}px`;
  const textW = ctx.measureText(label).width;
  ctx.letterSpacing = "0px";
  const w = textW + padX * 2;
  const h = fontSize + padY * 2;

  ctx.translate(x, y + h / 2);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.fillStyle = inverted ? DARK_ON_AMBER : AMBER;
  roundRect(ctx, 0, -h / 2, w, h, 10);
  ctx.fill();
  text(ctx, label, padX, fontSize * 0.35, {
    font: `800 ${fontSize}px ${f}`,
    color: inverted ? AMBER : DARK_ON_AMBER,
    spacing,
  });
  ctx.restore();
  return h;
}

/** Rótulo de seção: "#02 — #05" + linha fina + legenda à direita. */
function drawSectionDivider(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  leftLabel: string,
  rightLabel: string,
  p: Palette,
  f: string,
  stories: boolean,
) {
  const leftSize = stories ? 26 : 20;
  const rightSize = stories ? 24 : 18;
  const leftSpacing = leftSize * 0.2;
  const rightSpacing = rightSize * 0.1;
  const baselineY = y + leftSize * 0.85;
  const midY = y + leftSize * 0.48;

  ctx.save();
  ctx.font = `700 ${leftSize}px ${f}`;
  ctx.letterSpacing = `${leftSpacing}px`;
  const leftW = ctx.measureText(leftLabel).width;
  ctx.letterSpacing = "0px";

  text(ctx, leftLabel, x, baselineY, {
    font: `700 ${leftSize}px ${f}`,
    color: p.accent,
    spacing: leftSpacing,
  });

  let rightW = 0;
  if (rightLabel) {
    ctx.font = `500 ${rightSize}px ${f}`;
    ctx.letterSpacing = `${rightSpacing}px`;
    rightW = ctx.measureText(rightLabel).width;
    ctx.letterSpacing = "0px";
    text(ctx, rightLabel, x + w, baselineY, {
      font: `500 ${rightSize}px ${f}`,
      color: p.inkSoft,
      align: "right",
      spacing: rightSpacing,
    });
  }

  const lineX1 = x + leftW + (stories ? 20 : 16);
  const lineX2 = rightLabel ? x + w - rightW - (stories ? 20 : 16) : x + w;
  if (lineX2 > lineX1 + 12) {
    hairline(ctx, lineX1, midY, lineX2, midY, hexAlpha(p.ink, 0.1), 1.5);
  }
  ctx.restore();
}

function drawShadowCover(
  ctx: Ctx,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  side: number,
  radius: number,
  fallbackIndex: number,
  shadowAlpha = 0.45,
) {
  ctx.save();
  const k = ctx.getTransform().a;
  ctx.shadowColor = `rgba(0,0,0,${shadowAlpha})`;
  ctx.shadowBlur = 32 * k;
  ctx.shadowOffsetY = 14 * k;
  ctx.fillStyle = "#000";
  roundRect(ctx, x, y, side, side, radius);
  ctx.fill();
  ctx.restore();
  cover(ctx, img, x, y, side, side, radius, fallbackIndex);
}

function drawCirclePortrait(
  ctx: Ctx,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  dia: number,
  fallbackLetter: string,
  p: Palette,
  f: string,
  opts?: { ringColor?: string; ringWidth?: number; shadow?: boolean },
) {
  const r = dia / 2;
  if (opts?.shadow) {
    ctx.save();
    const k = ctx.getTransform().a;
    ctx.shadowColor = "rgba(0,0,0,0.48)";
    ctx.shadowBlur = 34 * k;
    ctx.shadowOffsetY = 14 * k;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = p.card;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.naturalWidth > 0) {
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - s) / 2;
    const sy = Math.max(0, (img.naturalHeight - s) * 0.2);
    ctx.drawImage(img, sx, sy, s, s, cx - r, cy - r, dia, dia);
  } else {
    ctx.fillStyle = p.card2;
    ctx.fillRect(cx - r, cy - r, dia, dia);
    text(ctx, fallbackLetter.toUpperCase(), cx, cy + r * 0.34, {
      font: `700 ${Math.round(dia * 0.42)}px ${f}`,
      color: hexAlpha(p.ink, 0.72),
      align: "center",
    });
  }
  ctx.restore();

  if (opts?.ringColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = opts.ringColor;
    ctx.lineWidth = opts.ringWidth ?? 3;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Disco de vinil saindo por trás da capa do álbum nº 01:
 * preto clássico com sulcos finos (padrão) ou vinil colorido contrastante com a capa.
 */
function drawPeekingVinyl(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  labelImg: HTMLImageElement | null,
  p: Palette,
  vinylColor: string | null,
) {
  ctx.save();
  const k = ctx.getTransform().a;
  ctx.shadowColor = "rgba(0,0,0,0.52)";
  ctx.shadowBlur = 32 * k;
  ctx.shadowOffsetY = 12 * k;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = vinylColor ?? "#0B100E";
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Recorta dentro do círculo para desenhar reflexos e sulcos sem vazar
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (vinylColor) {
    // Vinil colorido: acabamento liso vibrante com poucos sulcos delicados e brilho (igual ao Toca-discos)
    ctx.strokeStyle = "rgba(0,0,0,0.09)";
    ctx.lineWidth = 1.6;
    for (const ratio of [0.5, 0.68, 0.84]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = Math.round(r * 0.24);
    for (const start of [-Math.PI * 0.32, Math.PI * 0.68]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, start, start + Math.PI * 0.2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    // Vinil escuro clássico (fiel à imagem de referência de top álbuns)
    const sheen = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    sheen.addColorStop(0, "rgba(38,52,46,0.35)");
    sheen.addColorStop(0.45, "rgba(11,16,14,0)");
    sheen.addColorStop(0.72, "rgba(38,52,46,0.45)");
    sheen.addColorStop(1, "rgba(11,16,14,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1.4;
    for (let gr = Math.round(r * 0.28); gr < r - 4; gr += 8) {
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(p.accent, 0.28);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Selo central do disco (mais visível quando colorido, discreto no preto)
  const labelR = Math.round(r * 0.24);
  if (vinylColor && labelImg && labelImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, labelR, 0, Math.PI * 2);
    ctx.clip();
    const s = Math.min(labelImg.naturalWidth, labelImg.naturalHeight);
    ctx.drawImage(
      labelImg,
      (labelImg.naturalWidth - s) / 2,
      (labelImg.naturalHeight - s) / 2,
      s,
      s,
      cx - labelR,
      cy - labelR,
      labelR * 2,
      labelR * 2,
    );
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, labelR, 0, Math.PI * 2);
    ctx.fillStyle = vinylColor ? p.accent : "#121A17";
    ctx.fill();
  }

  // Furo central
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(6, Math.round(r * 0.045)), 0, Math.PI * 2);
  ctx.fillStyle = p.room;
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawMasthead(ctx: Ctx, m: MastheadLayout, d: TopsCardData, o: TopsCardOptions) {
  const f = o.font;
  const p = o.palette;
  const dict = DICTS[o.lang];
  const stories = o.format === "stories";
  const headFont = stories ? 28 : 22;

  // Cabeçalho: "SULCO" à esquerda na cor de destaque e "@usuario" à direita
  text(ctx, "SULCO", m.margin, m.metaY, {
    font: `700 ${headFont}px ${f}`,
    color: p.accent,
    spacing: headFont * 0.22,
  });

  if (o.showUsername && d.username) {
    text(ctx, `@${d.username}`, m.margin + m.inner, m.metaY, {
      font: `500 ${headFont}px ${f}`,
      color: p.inkSoft,
      align: "right",
      maxWidth: m.inner * 0.62,
      spacing: headFont * 0.04,
    });
  }

  hairline(ctx, m.margin, m.ruleY, m.margin + m.inner, m.ruleY, hexAlpha(p.ink, 0.1), 1.5);

  const rawTitle = dict.tops.cardTitles[o.kind] ?? o.kind;
  const titleSize = fitFontSize(ctx, `${rawTitle}.`, m.inner, m.titleSize, stories ? 64 : 46, (px) => `700 ${px}px ${f}`);
  const titleSpacing = -titleSize * 0.045;
  ctx.font = `700 ${titleSize}px ${f}`;
  ctx.letterSpacing = `${titleSpacing}px`;
  const titleW = ctx.measureText(rawTitle).width;
  ctx.letterSpacing = "0px";

  text(ctx, rawTitle, m.margin - 2, m.titleY, {
    font: `700 ${titleSize}px ${f}`,
    color: p.ink,
    spacing: titleSpacing,
  });
  text(ctx, ".", m.margin - 2 + titleW + 2, m.titleY, {
    font: `700 ${titleSize}px ${f}`,
    color: p.accent,
  });

  // Pílula do período (ex.: "ÚLTIMOS 30 DIAS", "OUTUBRO DE 2026")
  const periodStr = d.periodLabel.toLocaleUpperCase("pt-BR");
  const pillFont = stories ? 26 : 20;
  const pillSpacing = pillFont * 0.16;
  const padX = stories ? 28 : 22;
  ctx.save();
  ctx.font = `700 ${pillFont}px ${f}`;
  ctx.letterSpacing = `${pillSpacing}px`;
  const textW = Math.min(m.inner - padX * 2, ctx.measureText(periodStr).width);
  ctx.letterSpacing = "0px";
  const pillW = textW + padX * 2;
  ctx.fillStyle = hexAlpha(p.accent, 0.12);
  roundRect(ctx, m.margin, m.periodY, pillW, m.periodH, m.periodH / 2);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(p.accent, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, periodStr, m.margin + padX, m.periodY + m.periodH / 2 + pillFont * 0.35, {
    font: `700 ${pillFont}px ${f}`,
    color: p.accent,
    maxWidth: m.inner - padX * 2,
    spacing: pillSpacing,
  });
  ctx.restore();
}

function drawFooter(ctx: Ctx, m: MastheadLayout, d: TopsCardData, o: TopsCardOptions) {
  const f = o.font;
  const p = o.palette;
  const stories = o.format === "stories";
  const rightEdge = m.margin + m.inner;
  const centerY = m.footerTop + m.footerH / 2;
  const metaSize = stories ? 28 : 22;

  text(ctx, "dados: Last.fm", m.margin, centerY + Math.round(metaSize * 0.36), {
    font: `500 ${metaSize}px ${f}`,
    color: p.inkSoft,
  });

  const wordSize = stories ? 62 : 48;
  const wordSpacing = -wordSize * 0.04;
  ctx.save();
  ctx.font = `700 ${wordSize}px ${f}`;
  ctx.letterSpacing = `${wordSpacing}px`;
  const wordW = ctx.measureText("ulco").width;
  ctx.letterSpacing = "0px";
  ctx.restore();

  const discDia = stories ? 60 : 46;
  const discR = discDia / 2;
  const wordX = rightEdge - wordW;
  const discCx = wordX - 2 - discR;
  const discCy = centerY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(discCx, discCy, discR, 0, Math.PI * 2);
  ctx.fillStyle = AMBER;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(discCx, discCy, discR - 2.2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = stories ? 5 : 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(discCx, discCy, discR - (stories ? 9 : 7), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(14,22,19,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const sSize = stories ? 46 : 36;
  text(ctx, "s", discCx, discCy + Math.round(sSize * 0.3), {
    font: `700 ${sSize}px ${f}`,
    color: DARK_ON_AMBER,
    align: "center",
  });
  ctx.restore();

  text(ctx, "ulco", wordX, centerY + Math.round(wordSize * 0.29), {
    font: `700 ${wordSize}px ${f}`,
    color: p.ink,
    spacing: wordSpacing,
  });

  const urlRight = discCx - discR - (stories ? 28 : 20);
  text(ctx, d.siteHost, urlRight, centerY + Math.round(metaSize * 0.36), {
    font: `500 ${metaSize}px ${f}`,
    color: p.inkSoft,
    align: "right",
    maxWidth: m.inner * 0.45,
  });
}

// ---------------- CARD 1: TOP ARTISTAS ----------------

function drawArtistGridCell(
  ctx: Ctx,
  cell: GalleryCell,
  item: TopsCardItem,
  topPlaycount: number,
  o: TopsCardOptions,
) {
  const f = o.font;
  const p = o.palette;
  const rankStr = String(cell.rank).padStart(2, "0");

  // Quadrado Top 10: 2 colunas horizontais (foto circular à esquerda + número, nome, barra e reproduções à direita)
  const midY = cell.y + cell.h / 2;
  const cx = cell.x + cell.artSide / 2;
  drawCirclePortrait(ctx, item.image, cx, midY, cell.artSide, item.name.charAt(0), p, f, {
    ringColor: hexAlpha(p.accent, 0.42),
    ringWidth: 3,
    shadow: true,
  });

  const tx = cell.x + cell.artSide + 16;
  const maxW = Math.max(80, cell.x + cell.w - tx);
  const rankSize = 22;
  const nameSize = 24;
  const barH = 7;
  const cntSize = 18;
  const ratio = topPlaycount > 0 ? Math.max(0.06, Math.min(1, item.playcount / topPlaycount)) : 0;

  ctx.font = `700 ${rankSize}px ${f}`;
  const rankW = ctx.measureText(rankStr).width + 9;
  const nameMaxW = Math.max(60, maxW - rankW);
  const fitName = fitFontSize(ctx, item.name, nameMaxW, nameSize, 18, (px) => `700 ${px}px ${f}`);

  const blockH = fitName + (o.showNumbers ? 8 + barH + 6 + cntSize : 0);
  const nameY = midY - blockH / 2 + Math.round(fitName * 0.84);

  text(ctx, rankStr, tx, nameY, { font: `700 ${rankSize}px ${f}`, color: p.accent });
  text(ctx, item.name, tx + rankW, nameY, {
    font: `700 ${fitName}px ${f}`,
    color: p.ink,
    maxWidth: nameMaxW,
    spacing: -0.3,
  });

  if (o.showNumbers) {
    const barY = nameY + Math.round(fitName * 0.24) + 5;
    ctx.fillStyle = p.line;
    roundRect(ctx, tx, barY, maxW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = p.accent;
    roundRect(ctx, tx, barY, Math.max(barH * 2, maxW * ratio), barH, barH / 2);
    ctx.fill();

    text(ctx, formatPlays(item.playcount, o.lang), tx, barY + barH + 19, {
      font: `500 ${cntSize}px ${f}`,
      color: p.inkSoft,
      maxWidth: maxW,
    });
  }
}

function drawArtistsPoster(
  ctx: Ctx,
  layout: Extract<TopsLayout, { kind: "artists" }>,
  d: TopsCardData,
  o: TopsCardOptions,
) {
  const f = o.font;
  const p = o.palette;
  const dict = DICTS[o.lang];
  const stories = o.format === "stories";
  const heroItem = d.items[0];
  const topPlaycount = heroItem?.playcount || 1;

  if (heroItem) {
    const h = layout.hero;
    drawCirclePortrait(
      ctx,
      heroItem.image,
      h.circleX + h.circleDia / 2,
      h.circleY + h.circleDia / 2,
      h.circleDia,
      heroItem.name.charAt(0),
      p,
      f,
      { ringColor: hexAlpha(p.accent, 0.55), ringWidth: 4, shadow: true },
    );

    const maxW = h.textW;
    const maxName = stories ? (o.count === 5 ? 148 : 112) : o.count === 5 ? 92 : 76;
    const minName = stories ? 54 : 42;
    const fitted = fitWrappedFontSize(ctx, heroItem.name, maxW, 2, maxName, minName, (px) => `700 ${px}px ${f}`);
    const nameSize = fitted.size;
    const wrapped = fitted.lines;
    const lh = Math.round(nameSize * 0.98);
    const chipH = stories ? 52 : 39;
    const chipGap = stories ? (o.count === 5 ? 24 : 18) : 16;
    const playsSize = stories ? (o.count === 5 ? 42 : 34) : 30;
    const playsGap = stories ? (o.count === 5 ? 20 : 14) : 12;
    const titleH = Math.round(nameSize * 1.02) + Math.max(0, wrapped.length - 1) * lh;
    const playsH = o.showNumbers ? playsGap + playsSize : 0;
    const blockH = chipH + chipGap + titleH + playsH;
    const startY = h.textY + Math.max(0, (h.textH - blockH) / 2);

    drawNumberOneChip(ctx, dict.tops.heroLabels.artists, h.textX, startY, f, stories);
    let baseY = startY + chipH + chipGap + Math.round(nameSize * 0.8);

    wrapped.forEach((line, idx) => {
      if (idx > 0) baseY += lh;
      text(ctx, line, h.textX - 3, baseY, {
        font: `700 ${nameSize}px ${f}`,
        color: p.ink,
        maxWidth: maxW,
        spacing: -nameSize * 0.05,
      });
    });

    if (o.showNumbers) {
      const playsY = baseY + Math.round(nameSize * 0.22) + playsGap + Math.round(playsSize * 0.82);
      text(ctx, formatPlays(heroItem.playcount, o.lang), h.textX, playsY, {
        font: `700 ${playsSize}px ${f}`,
        color: p.accent,
        maxWidth: maxW,
      });
    }
  }

  const lastRank = Math.min(d.items.length, o.count);
  if (lastRank >= 2) {
    const leftLabel = `#02 — #${String(lastRank).padStart(2, "0")}`;
    drawSectionDivider(ctx, layout.masthead.margin, layout.sectionLabelY, layout.masthead.inner, leftLabel, "", p, f, stories);
  }

  // Lista vertical (Top 5 em Stories/Quadrado e Top 10 em Stories): número + nome + barra + reproduções + foto circular
  layout.rows.forEach((slot) => {
    const item = d.items[slot.rank - 1];
    if (!item) return;
    const compact = slot.compact;
    const midY = slot.y + slot.h / 2;
    const numW = stories ? (compact ? 74 : 92) : 70;
    const numSize = stories ? (compact ? 32 : 48) : 34;
    const nameMax = stories ? (compact ? 38 : 64) : 42;
    const nameMin = stories ? (compact ? 24 : 34) : 26;
    const barH = stories ? (compact ? 9 : 14) : 10;
    const cntSize = stories ? (compact ? 22 : 32) : 24;
    const photoGap = stories ? (compact ? 34 : 52) : 34;
    const ratio = topPlaycount > 0 ? Math.max(0.05, Math.min(1, item.playcount / topPlaycount)) : 0;

    const photoX = slot.x + slot.w - slot.artSide;
    drawCirclePortrait(
      ctx,
      item.image,
      photoX + slot.artSide / 2,
      midY,
      slot.artSide,
      item.name.charAt(0),
      p,
      f,
      { ringColor: hexAlpha(p.accent, 0.4), ringWidth: compact ? 3 : stories ? 4 : 3 },
    );

    text(ctx, String(item.rank).padStart(2, "0"), slot.x, midY + Math.round(numSize * 0.35), {
      font: `700 ${numSize}px ${f}`,
      color: p.accent,
    });

    const textX = slot.x + numW;
    const barW = Math.max(120, photoX - photoGap - textX);
    const nameSize = fitFontSize(ctx, item.name, barW, nameMax, nameMin, (px) => `700 ${px}px ${f}`);
    const gap1 = compact ? 10 : stories ? 18 : 12;
    const gap2 = compact ? 8 : stories ? 12 : 8;
    const blockH = nameSize + (o.showNumbers ? gap1 + barH + gap2 + cntSize : 0);
    const y = midY - blockH / 2 + Math.round(nameSize * 0.84);

    text(ctx, item.name, textX - 1, y, {
      font: `700 ${nameSize}px ${f}`,
      color: p.ink,
      maxWidth: barW,
      spacing: -nameSize * 0.03,
    });

    if (o.showNumbers) {
      const barY = y + (compact ? 11 : stories ? 14 : 10);
      ctx.fillStyle = p.line;
      roundRect(ctx, textX, barY, barW, barH, barH / 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      roundRect(ctx, textX, barY, Math.max(barH * 2, barW * ratio), barH, barH / 2);
      ctx.fill();

      text(ctx, formatPlays(item.playcount, o.lang), textX, barY + barH + (compact ? 23 : stories ? 34 : 26), {
        font: `500 ${cntSize}px ${f}`,
        color: p.inkSoft,
        maxWidth: barW,
      });
    }
  });

  // 2 colunas horizontais (Quadrado Top 10 Artistas)
  layout.gridCells.forEach((cell) => {
    const item = d.items[cell.rank - 1];
    if (item) drawArtistGridCell(ctx, cell, item, topPlaycount, o);
  });
}

// ---------------- CARD 2: TOP ÁLBUNS ----------------

/** Desenha o insight "96% do que você ouviu de Milo j foi este disco." com a % em negrito claro. */
function drawAlbumInsightNote(
  ctx: Ctx,
  lead: string,
  rest: string,
  x: number,
  y: number,
  maxW: number,
  fontSize: number,
  p: Palette,
  f: string,
) {
  const full = `${lead}${rest}`;
  ctx.font = `500 ${fontSize}px ${f}`;
  const lines = wrapText(full, maxW, 3, measureWith(ctx));
  const lh = Math.round(fontSize * 1.32);

  lines.forEach((line, idx) => {
    const ly = y + idx * lh;
    if (idx === 0 && line.startsWith(lead)) {
      ctx.font = `700 ${fontSize}px ${f}`;
      const leadW = ctx.measureText(lead).width;
      const spaceW = ctx.measureText(" ").width;
      text(ctx, lead, x, ly, { font: `700 ${fontSize}px ${f}`, color: p.ink });
      const tail = line.slice(lead.length).trimStart();
      if (tail) {
        text(ctx, tail, x + leadW + spaceW, ly, {
          font: `500 ${fontSize}px ${f}`,
          color: p.inkSoft,
          maxWidth: Math.max(40, maxW - leadW - spaceW),
        });
      }
    } else {
      text(ctx, line, x, ly, {
        font: `500 ${fontSize}px ${f}`,
        color: p.inkSoft,
        maxWidth: maxW,
      });
    }
  });
}

function drawAlbumCell(ctx: Ctx, cell: GalleryCell, item: TopsCardItem, o: TopsCardOptions) {
  const f = o.font;
  const p = o.palette;
  const stories = o.format === "stories";
  const rankStr = String(cell.rank).padStart(2, "0");

  if (cell.horizontal) {
    // Quadrado: capa à esquerda + número, título, artista e reproduções à direita
    const radius = cell.compact ? 12 : 16;
    const coverY = cell.y + (cell.h - cell.artSide) / 2;
    drawShadowCover(ctx, item.image, cell.x, coverY, cell.artSide, radius, cell.rank, 0.42);

    const tx = cell.x + cell.artSide + (cell.compact ? 14 : 20);
    const maxW = Math.max(60, cell.x + cell.w - tx);
    const numSize = cell.compact ? 22 : 28;
    const nameSize = cell.compact ? 22 : 28;
    const arSize = cell.compact ? 18 : 24;
    const plSize = cell.compact ? 18 : 24;

    ctx.font = `700 ${nameSize}px ${f}`;
    const wrapped = wrapText(item.name, maxW, 2, measureWith(ctx));
    const lh = Math.round(nameSize * 1.08);
    const totalH =
      numSize + 4 + wrapped.length * lh + (item.detail ? arSize + 6 : 0) + (o.showNumbers && !cell.compact ? plSize + 4 : 0);
    let y = cell.y + Math.max(0, (cell.h - totalH) / 2) + Math.round(numSize * 0.85);

    text(ctx, rankStr, tx, y, { font: `800 ${numSize}px ${f}`, color: p.accent, spacing: numSize * 0.06 });
    y += Math.round(nameSize * 1.05);

    wrapped.forEach((line) => {
      text(ctx, line, tx, y, { font: `700 ${nameSize}px ${f}`, color: p.ink, maxWidth: maxW, spacing: -0.3 });
      y += lh;
    });

    if (item.detail) {
      text(ctx, item.detail, tx, y + 2, { font: `500 ${arSize}px ${f}`, color: p.inkSoft, maxWidth: maxW });
      y += arSize + 6;
    }

    if (o.showNumbers && !cell.compact) {
      text(ctx, formatPlays(item.playcount, o.lang), tx, y + 2, {
        font: `700 ${plSize}px ${f}`,
        color: p.accent,
        maxWidth: maxW,
      });
    }
    return;
  }

  // Stories Top 10: grade 3×3 limpa com capa em cima e texto abaixo
  const coverX = cell.x + (cell.w - cell.artSide) / 2;
  drawShadowCover(ctx, item.image, coverX, cell.y, cell.artSide, 14, cell.rank, 0.38);

  const nameSize = stories ? 23 : 18;
  const arSize = stories ? 20 : 15;
  let ty = cell.y + cell.artSide + 28;

  ctx.font = `800 ${nameSize}px ${f}`;
  const rankW = ctx.measureText(rankStr).width + 8;
  text(ctx, rankStr, coverX, ty, { font: `800 ${nameSize}px ${f}`, color: p.accent });
  text(ctx, item.name, coverX + rankW, ty, {
    font: `700 ${nameSize}px ${f}`,
    color: p.ink,
    maxWidth: Math.max(40, cell.artSide - rankW),
    spacing: -0.3,
  });

  if (item.detail) {
    ty += Math.round(arSize * 1.35);
    text(ctx, item.detail, coverX, ty, { font: `500 ${arSize}px ${f}`, color: p.inkSoft, maxWidth: cell.artSide });
  }
}

function drawAlbumsPoster(
  ctx: Ctx,
  layout: Extract<TopsLayout, { kind: "albums" }>,
  d: TopsCardData,
  o: TopsCardOptions,
) {
  const f = o.font;
  const p = o.palette;
  const dict = DICTS[o.lang];
  const stories = o.format === "stories";
  const heroItem = d.items[0];

  if (heroItem) {
    const h = layout.hero;
    // 1. Disco de vinil saindo por trás da capa pela direita (preto clássico ou colorido!)
    drawPeekingVinyl(
      ctx,
      h.vinylX + h.vinylDia / 2,
      h.vinylY + h.vinylDia / 2,
      h.vinylDia / 2,
      heroItem.image,
      p,
      o.vinylColor ?? null,
    );

    // 2. Capa grande na frente com sombra
    drawShadowCover(ctx, heroItem.image, h.coverX, h.coverY, h.coverSide, stories ? 22 : 16, 0, 0.55);

    // 3. Coluna de texto à direita
    const maxW = h.textW;
    const maxTitle = stories ? (o.count === 5 ? 54 : 46) : o.count === 5 ? 38 : 32;
    const minTitle = stories ? 32 : 24;
    const fitted = fitWrappedFontSize(ctx, heroItem.name, maxW, 3, maxTitle, minTitle, (px) => `700 ${px}px ${f}`);
    const nameSize = fitted.size;
    const wrapped = fitted.lines;
    const lh = Math.round(nameSize * 1.08);
    const chipH = stories ? 52 : 39;
    const chipGap = stories ? 22 : 14;
    const arSize = stories ? 34 : 25;
    const arGap = stories ? 14 : 8;
    const plSize = stories ? 36 : 26;
    const plGap = stories ? 14 : 8;
    const noteSize = stories ? 28 : 20;
    const noteGap = stories ? 20 : 12;
    const showNote = Boolean(o.showNumbers && d.albumArtistSharePct && heroItem.detail && (stories || o.count === 5));
    const titleH = Math.round(nameSize * 1.04) + Math.max(0, wrapped.length - 1) * lh;
    const noteH = showNote ? noteGap + noteSize * 2.6 : 0;
    const blockH =
      chipH +
      chipGap +
      titleH +
      (heroItem.detail ? arGap + arSize : 0) +
      (o.showNumbers ? plGap + plSize : 0) +
      noteH;
    const startY = h.textY + Math.max(0, (h.textH - blockH) / 2);

    drawNumberOneChip(ctx, dict.tops.heroLabels.albums, h.textX, startY, f, stories);
    let baseY = startY + chipH + chipGap + Math.round(nameSize * 0.82);

    wrapped.forEach((line, idx) => {
      if (idx > 0) baseY += lh;
      text(ctx, line, h.textX - 1, baseY, {
        font: `700 ${nameSize}px ${f}`,
        color: p.ink,
        maxWidth: maxW,
        spacing: -nameSize * 0.025,
      });
    });

    let bottomY = baseY + Math.round(nameSize * 0.22);

    if (heroItem.detail) {
      const arY = bottomY + arGap + Math.round(arSize * 0.82);
      text(ctx, heroItem.detail, h.textX, arY, { font: `500 ${arSize}px ${f}`, color: p.inkSoft, maxWidth: maxW });
      bottomY = arY + Math.round(arSize * 0.22);
    }

    if (o.showNumbers) {
      const plY = bottomY + plGap + Math.round(plSize * 0.82);
      text(ctx, formatPlays(heroItem.playcount, o.lang), h.textX, plY, {
        font: `700 ${plSize}px ${f}`,
        color: p.accent,
        maxWidth: maxW,
      });
      bottomY = plY + Math.round(plSize * 0.22);
    }

    if (showNote && d.albumArtistSharePct && heroItem.detail) {
      const note = dict.tops.albumShareOfArtist(d.albumArtistSharePct, heroItem.detail);
      const noteY = bottomY + noteGap + Math.round(noteSize * 0.82);
      drawAlbumInsightNote(ctx, note.lead, note.rest, h.textX, noteY, maxW, noteSize, p, f);
    }
  }

  const lastRank = Math.min(d.items.length, o.count);
  if (lastRank >= 2) {
    drawSectionDivider(
      ctx,
      layout.masthead.margin,
      layout.sectionLabelY,
      layout.masthead.inner,
      `#02 — #${String(lastRank).padStart(2, "0")}`,
      "",
      p,
      f,
      stories,
    );
  }

  // Stories Top 5: lista vertical fiel à referência
  layout.rows.forEach((slot) => {
    const item = d.items[slot.rank - 1];
    if (!item) return;
    drawShadowCover(ctx, item.image, slot.x, slot.y, slot.artSide, 18, slot.rank, 0.45);

    const tx = slot.x + slot.artSide + 28;
    const maxW = Math.max(120, slot.x + slot.w - tx);
    const numSize = 40;
    const nameSize = 46;
    const arSize = 32;
    const plSize = 32;
    const rankStr = String(item.rank).padStart(2, "0");

    const blockH = nameSize + (item.detail ? arSize + 10 : 0) + (o.showNumbers ? plSize + 8 : 0);
    let y = slot.y + (slot.h - blockH) / 2 + Math.round(nameSize * 0.86);

    ctx.font = `800 ${numSize}px ${f}`;
    const numW = ctx.measureText(rankStr).width + 18;
    text(ctx, rankStr, tx, y, { font: `800 ${numSize}px ${f}`, color: p.accent, spacing: numSize * 0.04 });
    text(ctx, item.name, tx + numW, y, {
      font: `700 ${nameSize}px ${f}`,
      color: p.ink,
      maxWidth: Math.max(80, maxW - numW),
      spacing: -nameSize * 0.025,
    });

    if (item.detail) {
      y += arSize + 12;
      text(ctx, item.detail, tx, y, { font: `500 ${arSize}px ${f}`, color: p.inkSoft, maxWidth: maxW });
    }

    if (o.showNumbers) {
      y += plSize + 10;
      text(ctx, formatPlays(item.playcount, o.lang), tx, y, {
        font: `700 ${plSize}px ${f}`,
        color: p.accent,
        maxWidth: maxW,
      });
    }
  });

  // Grade (Quadrado 2×2 ou Top 10 3×3)
  layout.cells.forEach((cell) => {
    const item = d.items[cell.rank - 1];
    if (item) drawAlbumCell(ctx, cell, item, o);
  });
}

// ---------------- CARD 3: TOP MÚSICAS ----------------

function drawTracksPoster(
  ctx: Ctx,
  layout: Extract<TopsLayout, { kind: "tracks" }>,
  d: TopsCardData,
  o: TopsCardOptions,
) {
  const f = o.font;
  const p = o.palette;
  const dict = DICTS[o.lang];
  const stories = o.format === "stories";
  const heroItem = d.items[0];
  const topPlaycount = heroItem?.playcount || 1;
  const artistColor = hexAlpha(p.ink, 0.82);

  if (heroItem) {
    const h = layout.hero;
    drawShadowCover(ctx, heroItem.image, h.coverX, h.coverY, h.coverSide, stories ? 22 : 16, 0, 0.52);

    const maxW = h.textW;
    const maxTitle = stories ? (o.count === 5 ? 68 : 56) : o.count === 5 ? 46 : 38;
    const minTitle = stories ? 36 : 26;
    const fitted = fitWrappedFontSize(ctx, heroItem.name, maxW, 3, maxTitle, minTitle, (px) => `700 ${px}px ${f}`);
    const nameSize = fitted.size;
    const wrapped = fitted.lines;
    const lh = Math.round(nameSize * 1.03);
    const chipH = stories ? 52 : 39;
    const chipGap = stories ? 22 : 14;
    const arSize = stories ? 36 : 26;
    const arGap = stories ? 14 : 8;
    const plSize = stories ? 36 : 26;
    const plGap = stories ? 14 : 8;
    const titleH = Math.round(nameSize * 1.04) + Math.max(0, wrapped.length - 1) * lh;
    const blockH =
      chipH +
      chipGap +
      titleH +
      (heroItem.detail ? arGap + arSize : 0) +
      (o.showNumbers ? plGap + plSize : 0);
    const startY = h.textY + Math.max(0, (h.textH - blockH) / 2);

    drawNumberOneChip(ctx, dict.tops.heroLabels.tracks, h.textX, startY, f, stories);
    let baseY = startY + chipH + chipGap + Math.round(nameSize * 0.82);

    wrapped.forEach((line, idx) => {
      if (idx > 0) baseY += lh;
      text(ctx, line, h.textX - 1, baseY, {
        font: `700 ${nameSize}px ${f}`,
        color: p.ink,
        maxWidth: maxW,
        spacing: -nameSize * 0.03,
      });
    });

    let bottomY = baseY + Math.round(nameSize * 0.22);

    if (heroItem.detail) {
      const arY = bottomY + arGap + Math.round(arSize * 0.82);
      text(ctx, heroItem.detail, h.textX, arY, { font: `600 ${arSize}px ${f}`, color: artistColor, maxWidth: maxW });
      bottomY = arY + Math.round(arSize * 0.22);
    }

    if (o.showNumbers) {
      const plY = bottomY + plGap + Math.round(plSize * 0.82);
      text(ctx, formatPlays(heroItem.playcount, o.lang), h.textX, plY, {
        font: `700 ${plSize}px ${f}`,
        color: p.accent,
        maxWidth: maxW,
      });
    }
  }

  // Rótulo de seção: "#02 — #05" + linha fina + "REPRODUÇÕES"
  if (layout.rows.length > 0) {
    const lastRank = Math.min(d.items.length, o.count);
    drawSectionDivider(
      ctx,
      layout.masthead.margin,
      layout.sectionLabelY,
      layout.masthead.inner,
      `#02 — #${String(lastRank).padStart(2, "0")}`,
      o.showNumbers ? (dict.tops.sectionRight.tracks ?? "") : "",
      p,
      f,
      stories,
    );
  }

  // Lista #02–#05 (ou #10) sem miniaturas repetidas, sempre exibindo o artista com destaque claro
  layout.rows.forEach((slot) => {
    const item = d.items[slot.rank - 1];
    if (!item) return;
    const isCompact = slot.compact;
    const inlineArtist = !stories && isCompact; // Quadrado Top 10 (rowH = 54) mantém artista na mesma linha
    const artistName = (item.detail ?? "").trim();
    const numW = stories ? (isCompact ? 76 : 92) : isCompact ? 56 : 70;
    const numSize = stories ? (isCompact ? 32 : 48) : isCompact ? 24 : 34;
    const titleSize = stories ? (isCompact ? 32 : 52) : isCompact ? 26 : 34;
    const artistSize = stories ? (isCompact ? 23 : 32) : isCompact ? 21 : 23;
    const artistGap = stories ? (isCompact ? 5 : 8) : 5;
    const countSize = stories ? (isCompact ? 30 : 50) : isCompact ? 24 : 32;
    const barH = stories ? (isCompact ? 8 : 14) : isCompact ? 6 : 9;
    const barGap = stories ? (isCompact ? 10 : 16) : isCompact ? 9 : 10;
    const ratio = topPlaycount > 0 ? Math.max(0.06, Math.min(1, item.playcount / topPlaycount)) : 0;

    const stackedArtistH = !inlineArtist && artistName ? artistGap + artistSize : 0;
    const blockH = titleSize + stackedArtistH + (o.showNumbers ? barGap + barH : 0);
    const titleY = slot.y + Math.max(4, (slot.h - blockH) / 2) + Math.round(titleSize * 0.84);
    const numY = titleY - Math.round((titleSize - numSize) * 0.12);

    text(ctx, String(item.rank).padStart(2, "0"), slot.x, numY, {
      font: `700 ${numSize}px ${f}`,
      color: p.accent,
    });

    let rightLimit = slot.x + slot.w;
    if (o.showNumbers) {
      const countStr = formatNumber(item.playcount, o.lang);
      ctx.font = `700 ${countSize}px ${f}`;
      const countW = ctx.measureText(countStr).width;
      text(ctx, countStr, rightLimit, titleY, {
        font: `700 ${countSize}px ${f}`,
        color: p.ink,
        align: "right",
      });
      rightLimit -= countW + 20;
    }

    const titleX = slot.x + numW;
    const maxTitleW = Math.max(120, rightLimit - titleX);
    const titleSpacing = -titleSize * 0.025;
    let contentBottomY = titleY + Math.round(titleSize * 0.18);

    if (inlineArtist && artistName) {
      const sep = " · ";
      ctx.save();
      ctx.font = `700 ${titleSize}px ${f}`;
      ctx.letterSpacing = `${titleSpacing}px`;
      const rawTitleW = ctx.measureText(item.name).width;
      ctx.letterSpacing = "0px";
      ctx.font = `700 ${artistSize}px ${f}`;
      const sepW = ctx.measureText(sep).width;
      ctx.font = `600 ${artistSize}px ${f}`;
      const rawArtistW = ctx.measureText(artistName).width;
      ctx.restore();

      const artistY = titleY - Math.round((titleSize - artistSize) * 0.08);
      if (rawTitleW + sepW + rawArtistW <= maxTitleW) {
        text(ctx, item.name, titleX, titleY, { font: `700 ${titleSize}px ${f}`, color: p.ink, spacing: titleSpacing });
        text(ctx, sep, titleX + rawTitleW, artistY, { font: `700 ${artistSize}px ${f}`, color: p.accent });
        text(ctx, artistName, titleX + rawTitleW + sepW, artistY, {
          font: `600 ${artistSize}px ${f}`,
          color: artistColor,
        });
      } else {
        const artistMaxW = Math.min(rawArtistW, Math.round(maxTitleW * 0.42));
        const clippedTitleW = Math.max(90, maxTitleW - sepW - artistMaxW);
        text(ctx, item.name, titleX, titleY, {
          font: `700 ${titleSize}px ${f}`,
          color: p.ink,
          maxWidth: clippedTitleW,
          spacing: titleSpacing,
        });
        const actualW = Math.min(clippedTitleW, rawTitleW);
        text(ctx, sep, titleX + actualW, artistY, { font: `700 ${artistSize}px ${f}`, color: p.accent });
        text(ctx, artistName, titleX + actualW + sepW, artistY, {
          font: `600 ${artistSize}px ${f}`,
          color: artistColor,
          maxWidth: Math.max(50, maxTitleW - actualW - sepW),
        });
      }
    } else {
      text(ctx, item.name, titleX, titleY, {
        font: `700 ${titleSize}px ${f}`,
        color: p.ink,
        maxWidth: maxTitleW,
        spacing: titleSpacing,
      });

      if (artistName) {
        const artistY = contentBottomY + artistGap + Math.round(artistSize * 0.8);
        text(ctx, artistName, titleX, artistY, {
          font: `600 ${artistSize}px ${f}`,
          color: artistColor,
          maxWidth: maxTitleW,
        });
        contentBottomY = artistY + Math.round(artistSize * 0.2);
      }
    }

    if (o.showNumbers) {
      const barY = contentBottomY + barGap;
      const barW = slot.w - numW;
      ctx.fillStyle = p.line;
      roundRect(ctx, titleX, barY, barW, barH, barH / 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      roundRect(ctx, titleX, barY, Math.max(barH * 2, barW * ratio), barH, barH / 2);
      ctx.fill();
    }
  });
}

// ---------------- CARD 4: TOP GÊNEROS ----------------

function joinArtistNames(names: string[], andWord: string): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} ${andWord} ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} ${andWord} ${names[names.length - 1]}`;
}

function drawOverlappingStack(
  ctx: Ctx,
  names: string[],
  images: (HTMLImageElement | null)[],
  rightX: number,
  cy: number,
  dia: number,
  overlap: number,
  borderColor: string,
  p: Palette,
  f: string,
) {
  const count = Math.min(3, names.length);
  if (count === 0) return;
  const step = dia - overlap;
  const totalW = dia + (count - 1) * step;
  const startX = rightX - totalW;
  for (let i = 0; i < count; i++) {
    const cx = startX + i * step + dia / 2;
    drawCirclePortrait(ctx, images[i] ?? null, cx, cy, dia, names[i].charAt(0), p, f, {
      ringColor: borderColor,
      ringWidth: 4,
    });
  }
}

function drawGenresPoster(
  ctx: Ctx,
  layout: Extract<TopsLayout, { kind: "genres" }>,
  d: TopsCardData,
  o: TopsCardOptions,
) {
  const f = o.font;
  const p = o.palette;
  const dict = DICTS[o.lang];
  const stories = o.format === "stories";
  const top = d.genres[0];
  const maxWeight = top?.weight || 1;

  // Cartão preenchido #01 com selo contrastante, nome gigante, artistas e pilha de 3 fotos
  if (top) {
    const h = layout.hero;
    const padX = stories ? 52 : 34;
    const padY = stories ? 44 : 26;
    const radius = stories ? 34 : 26;

    ctx.save();
    ctx.fillStyle = p.accent;
    roundRect(ctx, h.x, h.y, h.w, h.h, radius);
    ctx.fill();
    ctx.restore();

    // Em paletas escuras (destaque claro como mint), selo escuro/âmbar; em paletas claras (destaque escuro), selo âmbar/escuro.
    const invertChip = contrastRatio(DARK_ON_AMBER, p.accent) > contrastRatio("#FFFFFF", p.accent);
    drawNumberOneChip(ctx, dict.tops.heroLabels.genres, h.x + padX, h.y + padY, f, stories, invertChip);

    const overlap = stories ? 42 : 28;
    const stackCount = Math.min(3, top.artists.length);
    const stackW = stackCount > 0 ? h.circleDia + (stackCount - 1) * (h.circleDia - overlap) : 0;
    const stackCy = stories ? h.y + 120 + h.circleDia / 2 : h.y + h.h / 2;
    drawOverlappingStack(ctx, top.artists, top.artistImages, h.x + h.w - padX, stackCy, h.circleDia, overlap, p.accent, p, f);

    const maxNameW = Math.max(200, h.w - padX * 2 - (stackW > 0 ? stackW + 24 : 0));
    const maxGenreSize = stories ? 186 : 86;
    const nameSize = fitFontSize(ctx, top.name, maxNameW, maxGenreSize, stories ? 64 : 44, (px) => `800 ${px}px ${f}`);
    const nameY = stories ? h.y + padY + 58 + Math.round(nameSize * 0.82) : h.y + padY + 46 + Math.round(nameSize * 0.78);

    text(ctx, top.name, h.x + padX - 4, nameY, {
      font: `800 ${nameSize}px ${f}`,
      color: p.accentInk,
      maxWidth: maxNameW,
      spacing: -nameSize * 0.06,
    });

    const sub = joinArtistNames(top.artists, dict.units.and);
    if (sub) {
      text(ctx, sub, h.x + padX, h.y + h.h - (stories ? 38 : 20), {
        font: `500 ${stories ? 34 : 23}px ${f}`,
        color: p.accentInk,
        maxWidth: h.w - padX * 2,
      });
    }
  }

  // Seção "#02 — #05"
  const lastRank = Math.min(d.genres.length, 5);
  if (lastRank >= 2) {
    drawSectionDivider(
      ctx,
      layout.masthead.margin,
      layout.sectionLabelY,
      layout.masthead.inner,
      `#02 — #${String(lastRank).padStart(2, "0")}`,
      "",
      p,
      f,
      stories,
    );
  }

  // Lista #02–#05: todas as barras com o MESMO comprimento de trilho (row.barW) e proporção real do #01
  layout.rows.forEach((row: GenreRow) => {
    const g = d.genres[row.rank - 1];
    if (!g) return;
    const midY = row.y + row.h / 2;
    const numW = stories ? 92 : 70;
    const numSize = stories ? 48 : 34;
    const barH = stories ? 14 : 10;
    const cntSize = stories ? 30 : 22;
    const ratio = maxWeight > 0 ? Math.max(0.06, Math.min(1, g.weight / maxWeight)) : 0;

    drawOverlappingStack(
      ctx,
      g.artists,
      g.artistImages,
      row.x + row.w,
      midY,
      row.circleDia,
      stories ? 28 : 20,
      p.room,
      p,
      f,
    );

    text(ctx, String(row.rank).padStart(2, "0"), row.x, midY + Math.round(numSize * 0.35), {
      font: `700 ${numSize}px ${f}`,
      color: p.accent,
    });

    const textX = row.x + numW;
    const nameMax = stories ? 78 : 48;
    const nameSize = fitFontSize(ctx, g.name, row.barW, nameMax, stories ? 38 : 28, (px) => `700 ${px}px ${f}`);
    const sub = joinArtistNames(g.artists, dict.units.and);
    const blockH = nameSize + (stories ? 18 : 12) + barH + (sub ? (stories ? 12 : 8) + cntSize : 0);
    const nameY = midY - blockH / 2 + Math.round(nameSize * 0.84);

    text(ctx, g.name, textX - 2, nameY, {
      font: `700 ${nameSize}px ${f}`,
      color: p.ink,
      maxWidth: row.barW,
      spacing: -nameSize * 0.04,
    });

    const barY = nameY + (stories ? 16 : 10);
    ctx.fillStyle = p.line;
    roundRect(ctx, textX, barY, row.barW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = p.accent;
    roundRect(ctx, textX, barY, Math.max(barH * 2, row.barW * ratio), barH, barH / 2);
    ctx.fill();

    if (sub) {
      text(ctx, sub, textX, barY + barH + (stories ? 34 : 25), {
        font: `500 ${cntSize}px ${f}`,
        color: p.inkSoft,
        maxWidth: row.barW,
      });
    }
  });
}

export function drawTopsCard(canvas: HTMLCanvasElement, data: TopsCardData, options: TopsCardOptions): void {
  const scale = options.scale ?? TOPS_SCALE;
  const actualCount = options.kind === "genres" ? data.genres.length : data.items.length;
  const layout = computeTopsLayout({
    kind: options.kind,
    format: options.format,
    targetCount: options.count,
    actualCount,
  });

  canvas.width = layout.masthead.width * scale;
  canvas.height = layout.masthead.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = options.palette.room;
  ctx.fillRect(0, 0, layout.masthead.width, layout.masthead.height);
  ctx.textBaseline = "alphabetic";

  drawCenteredGrooves(ctx, layout.masthead.width, layout.masthead.height, layout.grooves, options.palette);
  drawMasthead(ctx, layout.masthead, data, options);

  if (layout.kind === "artists") drawArtistsPoster(ctx, layout, data, options);
  else if (layout.kind === "albums") drawAlbumsPoster(ctx, layout, data, options);
  else if (layout.kind === "tracks") drawTracksPoster(ctx, layout, data, options);
  else drawGenresPoster(ctx, layout, data, options);

  drawFooter(ctx, layout.masthead, data, options);
}
