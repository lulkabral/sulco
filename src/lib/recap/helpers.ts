// Ajudantes de desenho comuns aos formatos do recap.

import { truncateText, wrapText } from "@/lib/canvas/text";
import { drawWordmark, wordmarkWidth } from "@/lib/canvas/brandmark";
import { TILE_COLORS } from "@/lib/theme";
import type { Palette } from "./palettes";

export type Ctx = CanvasRenderingContext2D;

export const W = 1080;
export const H = 1920;
/** Margem lateral. */
export const M = 80;
/** Largura útil entre as margens. */
export const INNER = W - M * 2;

export function measureWith(ctx: Ctx) {
  return (s: string) => ctx.measureText(s).width;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function card(ctx: Ctx, p: Palette, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = p.card;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/** Texto com fonte, cor e alinhamento, cortado com reticências se passar de `maxWidth`. */
export function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { font: string; color: string; maxWidth?: number; align?: CanvasTextAlign; spacing?: number },
) {
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  ctx.letterSpacing = `${opts.spacing ?? 0}px`; // navegadores sem suporte ignoram
  const shown = opts.maxWidth ? truncateText(value, opts.maxWidth, measureWith(ctx)) : value;
  ctx.fillText(shown, x, y);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";
}

/** Rótulo pequeno em maiúsculas e espaçado. */
export function eyebrow(
  ctx: Ctx,
  f: string,
  value: string,
  x: number,
  y: number,
  color: string,
  maxWidth: number,
  align: CanvasTextAlign = "left",
) {
  text(ctx, value.toLocaleUpperCase("pt-BR"), x, y, {
    font: `700 24px ${f}`,
    color,
    maxWidth,
    align,
    spacing: 4,
  });
}

/** Várias linhas, de cima para baixo. Devolve a posição (baseline) depois da última linha. */
export function lines(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { font: string; color: string; maxWidth: number; maxLines: number; lineHeight: number; align?: CanvasTextAlign },
): number {
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  let baseline = y;
  for (const line of wrapText(value, opts.maxWidth, opts.maxLines, measureWith(ctx))) {
    ctx.fillText(line, x, baseline);
    baseline += opts.lineHeight;
  }
  ctx.textAlign = "left";
  return baseline;
}

/** Maior tamanho de fonte (entre max e min) em que o texto cabe na largura. */
export function fitFontSize(
  ctx: Ctx,
  value: string,
  maxWidth: number,
  max: number,
  min: number,
  font: (px: number) => string,
): number {
  for (let px = max; px > min; px -= 4) {
    ctx.font = font(px);
    if (ctx.measureText(value).width <= maxWidth) return px;
  }
  return min;
}

/**
 * Capa recortada num retângulo de cantos arredondados (centralizada se o retângulo
 * não for quadrado). Sem capa: uma cor da paleta das peças abstratas.
 */
export function cover(
  ctx: Ctx,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fallbackIndex: number,
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) {
    const side = Math.min(img.naturalWidth, img.naturalHeight) || 1;
    const scale = Math.max(w, h) / side;
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = TILE_COLORS[(fallbackIndex * 3) % TILE_COLORS.length];
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/** Escurece uma faixa vertical até a cor do fundo (para texto em cima de capas). */
export function fadeToRoom(ctx: Ctx, p: Palette, y0: number, y1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, hexAlpha(p.room, 0));
  g.addColorStop(1, p.room);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

/** "#15120F" + 0.5 -> "rgba(21,18,15,0.5)". */
export function hexAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Tamanho da fonte do logo no rodapé. */
const SIGNATURE_PX = 42;

/**
 * Rodapé comum: crédito ao Last.fm à esquerda (exigência dos termos) e, à direita,
 * a assinatura: endereço do site + logo "sulco". Toda imagem compartilhada divulga o site.
 */
export function footer(ctx: Ctx, p: Palette, f: string, siteHost: string, y = 1850) {
  text(ctx, "dados: Last.fm", M, y, { font: `500 26px ${f}`, color: p.inkFaint });
  const logoW = wordmarkWidth(ctx, SIGNATURE_PX, f);
  drawWordmark(ctx, M + INNER - logoW, y + 2, SIGNATURE_PX, f, p.ink);
  text(ctx, siteHost, M + INNER - logoW - 18, y, {
    font: `600 24px ${f}`,
    color: p.inkSoft,
    align: "right",
    maxWidth: INNER / 2 - logoW,
  });
}
