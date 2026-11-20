// Formato "Mosaico": colagem das capas em tamanhos variados (a nº 1 grande),
// um bloco no destaque com o período e o título por cima da colagem.

import { DICTS } from "@/i18n";
import { formatPlays } from "@/lib/format";
import type { RecapData, RecapOptions } from "../draw";
import { cover, eyebrow, fadeToRoom, fitFontSize, footer, INNER, M, roundRect, text, W, type Ctx } from "../helpers";
import { ACCENT_ROOM, dateLine, genresLine, nameColumn } from "./shared";

const EDGE = 24; // margem da colagem
const GAP = 16;
const CELL = (W - EDGE * 2 - GAP * 3) / 4; // 246

/**
 * Posição de cada capa na grade 4x4: [coluna, linha, largura, altura] em células.
 * A ordem segue o ranking: o álbum nº 1 é o quadrado grande do canto.
 */
const CELLS: [number, number, number, number][] = [
  [0, 0, 2, 2], // 1
  [2, 0, 1, 1], // 2
  [2, 1, 1, 1], // 3
  [3, 1, 1, 1], // 4
  [0, 2, 1, 1], // 5
  [1, 2, 2, 2], // 6 (o outro quadrado grande)
  [3, 2, 1, 1], // 7
  [0, 3, 1, 1], // 8
  [3, 3, 1, 1], // 9
];
/** Célula que vira o bloco colorido com o período (canto de cima, longe do escurecimento). */
const TAG_CELL: [number, number] = [3, 0];

function cellRect(col: number, row: number, w: number, h: number) {
  return {
    x: EDGE + col * (CELL + GAP),
    y: EDGE + row * (CELL + GAP),
    w: w * CELL + (w - 1) * GAP,
    h: h * CELL + (h - 1) * GAP,
  };
}

export function drawMosaic(ctx: Ctx, d: RecapData, o: RecapOptions) {
  const f = o.font;
  const p = o.palette;

  CELLS.forEach(([col, row, w, h], i) => {
    const r = cellRect(col, row, w, h);
    cover(ctx, d.covers[i] ?? null, r.x, r.y, r.w, r.h, 22, i);
  });

  // Bloco do período, na cor de destaque.
  const tag = cellRect(TAG_CELL[0], TAG_CELL[1], 1, 1);
  ctx.fillStyle = p.accent;
  roundRect(ctx, tag.x, tag.y, tag.w, tag.h, 22);
  ctx.fill();
  const tagSize = fitFontSize(ctx, d.shortTag, tag.w - 36, 64, 28, (px) => `800 ${px}px ${f}`);
  text(ctx, d.shortTag, tag.x + tag.w / 2, tag.y + tag.h / 2 + tagSize * 0.36, {
    font: `800 ${tagSize}px ${f}`,
    color: p.accentInk,
    align: "center",
    maxWidth: tag.w - 24,
  });

  // A parte de baixo da colagem afunda no fundo, e o título fica por cima dela.
  const bottom = EDGE + 4 * CELL + 3 * GAP;
  fadeToRoom(ctx, p, bottom - 360, bottom + 4);

  const size = fitFontSize(ctx, d.title, INNER, 112, 60, (px) => `800 ${px}px ${f}`);
  // Acima do título fica o espaço do acento (Ú, Í, Ô): a linha de cima sobe junto com o tamanho.
  eyebrow(ctx, f, o.showUsername === false ? DICTS[o.lang].canvas.recapAnon : `@${d.username}`, M, bottom - 52 - size - ACCENT_ROOM, p.accent, INNER);
  text(ctx, d.title, M - 4, bottom - 52, { font: `800 ${size}px ${f}`, color: p.ink, maxWidth: INNER, spacing: -2 });
  dateLine(ctx, d, o, M, bottom + 10);

  const album = d.albums[0];
  if (album) {
    eyebrow(ctx, f, d.albumHeading, M, bottom + 100, p.inkSoft, INNER);
    text(ctx, album.name, M, bottom + 156, { font: `800 46px ${f}`, color: p.ink, maxWidth: INNER });
    const sub = [album.artist, o.showNumbers ? formatPlays(album.playcount, o.lang) : null].filter(Boolean).join(" · ");
    if (sub) text(ctx, sub, M, bottom + 200, { font: `500 30px ${f}`, color: p.inkSoft, maxWidth: INNER });
  }

  const colW = (INNER - 40) / 2;
  nameColumn(ctx, o, DICTS[o.lang].canvas.inYourHead, d.artists.slice(0, 5), M, 1340, colW, 34);
  nameColumn(ctx, o, DICTS[o.lang].canvas.onRepeat, d.tracks.slice(0, 5), M + colW + 40, 1340, colW, 30);

  genresLine(ctx, d, o, M, 1770, INNER);
  footer(ctx, p, f, d.siteHost);
}
