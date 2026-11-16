// Blocos usados por mais de um formato.

import { formatNumber, formatPlays } from "@/lib/format";
import type { RecapData, RecapListItem, RecapOptions } from "../draw";
import { eyebrow, measureWith, text, type Ctx } from "../helpers";

/**
 * Linha das datas. Com "mostrar números", ganha o total de scrobbles do período
 * no fim, em destaque, separado de qualquer álbum (para não parecer plays de um álbum).
 */
export function dateLine(ctx: Ctx, d: RecapData, o: RecapOptions, x: number, y: number, align: CanvasTextAlign = "left") {
  const f = o.font;
  const p = o.palette;
  if (!o.showNumbers) {
    text(ctx, d.dateText, x, y, { font: `500 32px ${f}`, color: p.inkSoft, align });
    return;
  }
  const date = `${d.dateText}  ·  `;
  const total = `${formatNumber(d.total)} scrobbles`;
  ctx.font = `500 32px ${f}`;
  const dateW = ctx.measureText(date).width;
  ctx.font = `800 32px ${f}`;
  const totalW = ctx.measureText(total).width;
  const start = align === "center" ? x - (dateW + totalW) / 2 : align === "right" ? x - dateW - totalW : x;
  text(ctx, date, start, y, { font: `500 32px ${f}`, color: p.inkSoft });
  text(ctx, total, start + dateW, y, { font: `800 32px ${f}`, color: p.accent });
}

/** Linha de baixo de um item: artista e/ou reproduções, conforme o caso. */
function subLine(item: RecapListItem, showNumbers: boolean): string | null {
  const plays = showNumbers ? formatPlays(item.playcount) : null;
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
    const sub = subLine(item, o.showNumbers);
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
  const label = "GÊNEROS   ";
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
