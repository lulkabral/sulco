// Blocos usados por mais de um formato.

import { DICTS } from "@/i18n";
import { formatNumber, formatPlays } from "@/lib/format";
import type { RecapData, RecapListItem, RecapOptions } from "../draw";
import { eyebrow, INNER, measureWith, text, type Ctx } from "../helpers";

/** Folga entre a linha de cima (@usuário) e o topo das letras do título, onde moram os acentos. */
export const ACCENT_ROOM = 22;

/** "564 scrobbles · 1.950 minutos" (os minutos só quando já foram estimados). */
export function totalsText(d: RecapData, o: Pick<RecapOptions, "lang">): string {
  const u = DICTS[o.lang].units;
  const scrobbles = `${formatNumber(d.total, o.lang)} ${u.scrobbles}`;
  return d.minutes ? `${scrobbles}  ·  ${formatNumber(d.minutes, o.lang)} ${u.minutes}` : scrobbles;
}

/**
 * Linha das datas. Com "mostrar scrobbles", ganha no fim, em destaque, o total de
 * scrobbles e os minutos do período (separado de qualquer álbum, para não parecer plays
 * de um álbum). Se não couber em `maxWidth`, a letra diminui até caber.
 */
export function dateLine(
  ctx: Ctx,
  d: RecapData,
  o: RecapOptions,
  x: number,
  y: number,
  align: CanvasTextAlign = "left",
  maxWidth = INNER,
) {
  const f = o.font;
  const p = o.palette;
  if (!o.showNumbers) {
    text(ctx, d.dateText, x, y, { font: `500 32px ${f}`, color: p.inkSoft, align });
    return;
  }
  const date = `${d.dateText}  ·  `;
  const total = totalsText(d, o);
  let size = 32;
  let dateW = 0;
  let totalW = 0;
  for (; size >= 22; size -= 2) {
    ctx.font = `500 ${size}px ${f}`;
    dateW = ctx.measureText(date).width;
    ctx.font = `800 ${size}px ${f}`;
    totalW = ctx.measureText(total).width;
    if (dateW + totalW <= maxWidth) break;
  }
  size = Math.max(size, 22);
  const start = align === "center" ? x - (dateW + totalW) / 2 : align === "right" ? x - dateW - totalW : x;
  text(ctx, date, start, y, { font: `500 ${size}px ${f}`, color: p.inkSoft });
  text(ctx, total, start + dateW, y, { font: `800 ${size}px ${f}`, color: p.accent });
}

/** Linha de baixo de um item: artista e/ou reproduções, conforme o caso. */
function subLine(item: RecapListItem, o: RecapOptions): string | null {
  const plays = o.showNumbers ? formatPlays(item.playcount, o.lang) : null;
  if (item.artist) return plays ? `${item.artist} · ${plays}` : item.artist;
  return plays;
}

/**
 * Coluna de nomes com título (ex.: "Na sua cabeça" + 5 artistas).
 * Itens com artista (músicas, álbuns) ganham uma linha de baixo. Devolve onde terminou.
 */
export function nameColumn(
  ctx: Ctx,
  o: RecapOptions,
  title: string,
  items: RecapListItem[],
  x: number,
  y: number,
  width: number,
  size = 34,
): number {
  const f = o.font;
  const p = o.palette;
  eyebrow(ctx, f, title, x, y, p.accent, width);
  let base = y + size + 22;
  items.forEach((item) => {
    text(ctx, item.name, x, base, { font: `700 ${size}px ${f}`, color: p.ink, maxWidth: width });
    const sub = subLine(item, o);
    if (sub) {
      text(ctx, sub, x, base + size * 0.8, { font: `500 ${Math.round(size * 0.66)}px ${f}`, color: p.inkSoft, maxWidth: width });
      base += size * 1.9;
    } else {
      base += size * 1.38;
    }
  });
  return base;
}

/** "Gêneros  pop · indie pop · R&B" numa linha só (some se não houver gêneros). */
export function genresLine(ctx: Ctx, d: RecapData, o: RecapOptions, x: number, y: number, width: number, align: CanvasTextAlign = "left") {
  if (!d.genres || d.genres.length === 0) return;
  const f = o.font;
  const p = o.palette;
  const label = `${DICTS[o.lang].canvas.genresLine}   `;
  ctx.font = `700 24px ${f}`;
  ctx.letterSpacing = "4px";
  const labelW = ctx.measureText(label).width;
  ctx.letterSpacing = "0px";
  ctx.font = `600 30px ${f}`;
  const measure = measureWith(ctx);
  // Junta só os gêneros que cabem inteiros.
  let list = "";
  for (const g of d.genres.slice(0, 5)) {
    const next = list ? `${list} · ${g}` : g;
    if (labelW + measure(next) > width) break;
    list = next;
  }
  const totalW = labelW + measure(list);
  const start = align === "center" ? x - totalW / 2 : x;
  eyebrow(ctx, f, label.trim(), start, y, p.accent, labelW);
  text(ctx, list, start + labelW, y, { font: `600 30px ${f}`, color: p.ink });
}
