// Formato "Clássico": fileira de capas no topo, título, cartão do álbum em destaque
// e quatro cartões com as listas. É o formato original do redesign "Sala escura".

import { DICTS } from "@/i18n";
import { formatNumber, formatPlays } from "@/lib/format";
import type { RecapData, RecapListItem, RecapOptions } from "../draw";
import { card, cover, eyebrow, fadeToRoom, fitFontSize, footer, INNER, lines, M, roundRect, text, type Ctx } from "../helpers";
import { ACCENT_ROOM, dateLine } from "./shared";

const GAP = 24;
const COL_W = (INNER - GAP) / 2;

export function drawClassic(ctx: Ctx, d: RecapData, o: RecapOptions) {
  const f = o.font;
  const p = o.palette;

  // Fileira de 5 capas cortada em cima, sumindo no fundo embaixo.
  for (let i = 0; i < 5; i++) cover(ctx, d.covers[i] ?? null, i * 220, -40, 200, 200, 20, i);
  fadeToRoom(ctx, p, 10, 200);

  const size = fitFontSize(ctx, d.title, INNER, 104, 64, (px) => `800 ${px}px ${f}`);
  // Acima do título fica o espaço do acento (Ú, Í, Ô): a linha de cima sobe junto com o tamanho.
  eyebrow(ctx, f, (o.showUsername === false ? DICTS[o.lang].canvas.recapAnon : DICTS[o.lang].canvas.recapOf(d.username)), M, 352 - size - ACCENT_ROOM, p.accent, INNER);
  text(ctx, d.title, M - 4, 352, { font: `800 ${size}px ${f}`, color: p.ink, maxWidth: INNER, spacing: -2 });
  dateLine(ctx, d, o, M, 408);

  // Cartão do álbum em destaque (sem o total: ele fica na linha das datas).
  const top = 460;
  const h = 400;
  card(ctx, p, M, top, INNER, h, 36);
  const pad = 40;
  const side = h - pad * 2;
  cover(ctx, d.covers[0] ?? null, M + pad, top + pad, side, side, 20, 0);
  const album = d.albums[0];
  if (album) {
    const x = M + pad + side + 40;
    const w = M + INNER - pad - x;
    eyebrow(ctx, f, d.albumHeading, x, top + 90, p.accent, w);
    let y = lines(ctx, album.name, x, top + 148, { font: `800 44px ${f}`, color: p.ink, maxWidth: w, maxLines: 3, lineHeight: 50 });
    if (album.artist) text(ctx, album.artist, x, y + 4, { font: `500 30px ${f}`, color: p.inkSoft, maxWidth: w });
    if (o.showNumbers) {
      y += 50;
      text(ctx, formatPlays(album.playcount, o.lang), x, y, { font: `700 26px ${f}`, color: p.accent, maxWidth: w });
    }
  }

  const lists = DICTS[o.lang].lists;
  listCard(ctx, o, M, 900, lists.artists, d.artists.slice(0, 5));
  listCard(ctx, o, M + COL_W + GAP, 900, lists.tracks, d.tracks.slice(0, 5));
  listCard(ctx, o, M, 1334, lists.albums, d.albums.slice(0, 5));
  genresCard(ctx, o, M + COL_W + GAP, 1334, d.genres);

  footer(ctx, p, f, d.siteHost);
}

function listCard(ctx: Ctx, o: RecapOptions, x: number, top: number, title: string, items: RecapListItem[]) {
  const f = o.font;
  const p = o.palette;
  card(ctx, p, x, top, COL_W, 410, 32);
  const pad = 32;
  const inner = COL_W - pad * 2;
  const left = x + pad;
  eyebrow(ctx, f, title, left, top + 58, p.inkSoft, inner);
  const rankW = 44;

  items.forEach((item, i) => {
    const base = top + 120 + i * 58;
    text(ctx, String(i + 1), left, base, { font: `800 30px ${f}`, color: p.accent });

    let nameWidth = inner - rankW;
    if (o.showNumbers && item.artist) {
      // Plays à direita do nome (músicas e álbuns).
      const plays = formatNumber(item.playcount, o.lang);
      ctx.font = `600 22px ${f}`;
      nameWidth -= ctx.measureText(plays).width + 14;
      text(ctx, plays, left + inner, base, { font: `600 22px ${f}`, color: p.inkFaint, align: "right" });
    }
    text(ctx, item.name, left + rankW, base, { font: `700 28px ${f}`, color: p.ink, maxWidth: nameWidth });

    const sub = item.artist ?? (o.showNumbers ? formatPlays(item.playcount, o.lang) : null);
    if (sub) text(ctx, sub, left + rankW, base + 28, { font: `500 22px ${f}`, color: p.inkSoft, maxWidth: inner - rankW });
  });
}

function genresCard(ctx: Ctx, o: RecapOptions, x: number, top: number, genres: string[] | null | undefined) {
  const f = o.font;
  const p = o.palette;
  card(ctx, p, x, top, COL_W, 410, 32);
  const pad = 32;
  const inner = COL_W - pad * 2;
  const left = x + pad;
  const c = DICTS[o.lang].canvas;
  eyebrow(ctx, f, DICTS[o.lang].lists.genres, left, top + 58, p.inkSoft, inner);
  if (!genres || genres.length === 0) {
    const note = genres === undefined ? c.calculating : genres ? c.noTags : c.unavailable;
    text(ctx, note, left, top + 120, { font: `500 26px ${f}`, color: p.inkSoft });
    return;
  }
  genres.slice(0, 5).forEach((genre, i) => {
    const base = top + 120 + i * 58;
    text(ctx, String(i + 1), left, base, { font: `800 30px ${f}`, color: p.accent });
    text(ctx, genre, left + 44, base, { font: `700 28px ${f}`, color: p.ink, maxWidth: inner - 44 });
    // Barrinha decrescente, como na página.
    ctx.fillStyle = p.line;
    roundRect(ctx, left + 44, base + 14, inner - 44, 6, 3);
    ctx.fill();
    ctx.globalAlpha = i === 0 ? 1 : 0.6;
    ctx.fillStyle = p.accent;
    roundRect(ctx, left + 44, base + 14, (inner - 44) * (1 - i * 0.16), 6, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}
