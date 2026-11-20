import type { Locale } from "@/i18n/config";
import { truncateText, wrapText } from "@/lib/canvas/text";
import { formatPlays } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { GRID_SCALE, GRID_SIDE, gridLayout, type GridCell, type GridSize } from "./layout";

export type GridAlbum = {
  name: string;
  artist: string;
  playcount: number;
  /** Capa já carregada, ou null se o álbum não tem capa (ou ela falhou). */
  cover: HTMLImageElement | null;
};

export type GridOptions = {
  size: GridSize;
  showCaption: boolean;
  showPlays: boolean;
  fontFamily: string;
  /** Língua do "N reproduções" desenhado. */
  lang: Locale;
  /** Escala do desenho (padrão GRID_SCALE). O palco da página inicial usa 1. */
  scale?: number;
};

// Cores da identidade "Sala escura" (src/lib/theme.ts).
const BG = THEME.room; // fundo da imagem e quadrados vazios
const NO_COVER_BG = THEME.card2; // álbum sem capa
const TEXT = THEME.ink;
const TEXT_SOFT = "rgba(244,238,230,0.82)";

/** Desenha a grade inteira no canvas (layout de 1500 px, exportado em 2400 x 2400 px). */
export function drawGrid(canvas: HTMLCanvasElement, albums: GridAlbum[], opts: GridOptions): void {
  const scale = opts.scale ?? GRID_SCALE;
  canvas.width = GRID_SIDE * scale;
  canvas.height = GRID_SIDE * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, GRID_SIDE, GRID_SIDE);

  for (const cell of gridLayout(opts.size)) {
    const album = albums[cell.index];
    if (!album) continue; // menos álbuns que quadrados: fica o fundo
    drawCell(ctx, cell, album, opts);
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: GridCell,
  album: GridAlbum,
  opts: GridOptions,
): void {
  const { x, y, side } = cell;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, side, side);
  ctx.clip();

  if (album.cover) {
    ctx.drawImage(album.cover, x, y, side, side);
  } else {
    drawNoCover(ctx, cell, album, opts.fontFamily);
  }

  // Sem capa, o nome já está no meio do quadrado: a faixa de baixo mostra só os plays.
  const showName = opts.showCaption && album.cover !== null;
  if (showName || opts.showPlays) {
    drawCaption(ctx, cell, album, showName, opts.showPlays, opts.fontFamily, opts.lang);
  }
  ctx.restore();
}

/** Quadrado neutro com o nome do álbum e do artista no meio. */
function drawNoCover(
  ctx: CanvasRenderingContext2D,
  { x, y, side }: GridCell,
  album: GridAlbum,
  fontFamily: string,
): void {
  ctx.fillStyle = NO_COVER_BG;
  ctx.fillRect(x, y, side, side);

  const pad = side * 0.1;
  const maxWidth = side - pad * 2;
  const nameSize = Math.round(side * 0.09);
  const artistSize = Math.round(side * 0.065);
  const lineHeight = nameSize * 1.2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `700 ${nameSize}px ${fontFamily}`;
  const lines = wrapText(album.name, maxWidth, 3, (s) => ctx.measureText(s).width);
  const blockHeight = lines.length * lineHeight + artistSize * 1.6;
  let cy = y + (side - blockHeight) / 2 + lineHeight / 2;

  ctx.fillStyle = TEXT;
  for (const line of lines) {
    ctx.fillText(line, x + side / 2, cy);
    cy += lineHeight;
  }

  ctx.font = `400 ${artistSize}px ${fontFamily}`;
  ctx.fillStyle = TEXT_SOFT;
  const artist = truncateText(album.artist, maxWidth, (s) => ctx.measureText(s).width);
  ctx.fillText(artist, x + side / 2, cy + artistSize * 0.3);
}

/** Faixa escura em degradê na parte de baixo, com nome, artista e/ou plays. */
function drawCaption(
  ctx: CanvasRenderingContext2D,
  { x, y, side }: GridCell,
  album: GridAlbum,
  showName: boolean,
  showPlays: boolean,
  fontFamily: string,
  lang: Locale,
): void {
  const pad = Math.round(side * 0.05);
  const maxWidth = side - pad * 2;
  const nameSize = Math.round(side * 0.072);
  const smallSize = Math.round(side * 0.058);
  const measure = (s: string) => ctx.measureText(s).width;

  // Linhas de baixo para cima.
  const lines: { text: string; font: string; color: string; size: number }[] = [];
  if (showName) {
    lines.push({ text: album.name, font: `700 ${nameSize}px ${fontFamily}`, color: TEXT, size: nameSize });
    lines.push({ text: album.artist, font: `400 ${smallSize}px ${fontFamily}`, color: TEXT_SOFT, size: smallSize });
  }
  if (showPlays) {
    lines.push({
      text: formatPlays(album.playcount, lang),
      font: `400 ${smallSize}px ${fontFamily}`,
      color: TEXT_SOFT,
      size: smallSize,
    });
  }

  const gap = side * 0.012;
  const textHeight = lines.reduce((sum, l) => sum + l.size * 1.15, 0) + gap * (lines.length - 1);
  const bandHeight = textHeight + pad * 2.5;

  const gradient = ctx.createLinearGradient(0, y + side - bandHeight, 0, y + side);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.6)");
  gradient.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y + side - bandHeight, side, bandHeight);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let baseline = y + side - textHeight - pad;
  for (const line of lines) {
    baseline += line.size * 1.15;
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(truncateText(line.text, maxWidth, measure), x + pad, baseline - line.size * 0.15);
    baseline += gap;
  }
}
