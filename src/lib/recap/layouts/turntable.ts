// Formato "Toca-discos": a capa do álbum nº 1 na frente, as capas 2 e 3 inclinadas
// atrás, e um vinil saindo da capa com ela mesma como selo. Embaixo, nomes sem números.

import { formatPlays } from "@/lib/format";
import type { RecapData, RecapOptions } from "../draw";
import { cover, eyebrow, fitFontSize, footer, INNER, lines, M, text, type Ctx } from "../helpers";
import { ACCENT_ROOM, dateLine, genresLine, nameColumn } from "./shared";

const SLEEVE = 540; // lado das capas
const SLEEVE_X = M;
const SLEEVE_Y = 150;

export function drawTurntable(ctx: Ctx, d: RecapData, o: RecapOptions) {
  const f = o.font;
  const p = o.palette;

  // Capas de trás (3 e 2), inclinadas, com sombra.
  tiltedSleeve(ctx, d.covers[2] ?? null, -13, -50, -24, 2);
  tiltedSleeve(ctx, d.covers[1] ?? null, -6, -22, -10, 1);

  // Vinil saindo pela direita.
  vinyl(ctx, d.covers[0] ?? null, 700, SLEEVE_Y + SLEEVE / 2, 330, p.accent, p.room);

  // Capa da frente (álbum nº 1).
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(SLEEVE_X, SLEEVE_Y, SLEEVE, SLEEVE, 14);
  ctx.fill();
  ctx.restore();
  cover(ctx, d.covers[0] ?? null, SLEEVE_X, SLEEVE_Y, SLEEVE, SLEEVE, 14, 0);

  // Título e datas.
  const size = fitFontSize(ctx, d.title, INNER, 104, 60, (px) => `800 ${px}px ${f}`);
  // Acima do título fica o espaço do acento (Ú, Í, Ô): a linha de cima sobe junto com o tamanho.
  eyebrow(ctx, f, `@${d.username}`, M, 920 - size - ACCENT_ROOM, p.accent, INNER);
  text(ctx, d.title, M - 4, 920, { font: `800 ${size}px ${f}`, color: p.ink, maxWidth: INNER, spacing: -2 });
  dateLine(ctx, d, o, M, 978);

  // O álbum.
  const album = d.albums[0];
  if (album) {
    eyebrow(ctx, f, d.albumHeading, M, 1070, p.inkSoft, INNER);
    const y = lines(ctx, album.name, M, 1134, { font: `800 56px ${f}`, color: p.ink, maxWidth: INNER, maxLines: 2, lineHeight: 62 });
    const sub = [album.artist, o.showNumbers ? formatPlays(album.playcount) : null].filter(Boolean).join(" · ");
    if (sub) text(ctx, sub, M, y + 2, { font: `500 34px ${f}`, color: p.inkSoft, maxWidth: INNER });
  }

  // Duas colunas de nomes.
  const colW = (INNER - 40) / 2;
  nameColumn(ctx, o, "Na sua cabeça", d.artists.slice(0, 5), M, 1340, colW, 34);
  nameColumn(ctx, o, "No repeat", d.tracks.slice(0, 5), M + colW + 40, 1340, colW, 30);

  genresLine(ctx, d, o, M, 1770, INNER);
  footer(ctx, p, f, d.siteHost);
}

/** Capa de trás, girada em torno do próprio centro e deslocada um pouco. */
function tiltedSleeve(ctx: Ctx, img: HTMLImageElement | null, degrees: number, dx: number, dy: number, index: number) {
  const cx = SLEEVE_X + SLEEVE / 2 + dx;
  const cy = SLEEVE_Y + SLEEVE / 2 + dy;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(-SLEEVE / 2, -SLEEVE / 2, SLEEVE, SLEEVE, 14);
  ctx.fill();
  ctx.shadowColor = "transparent";
  cover(ctx, img, -SLEEVE / 2, -SLEEVE / 2, SLEEVE, SLEEVE, 14, index);
  ctx.restore();
}

/** Disco de vinil: sulcos, brilho, selo com a capa, anel no destaque e furo no meio. */
function vinyl(ctx: Ctx, label: HTMLImageElement | null, cx: number, cy: number, r: number, accent: string, room: string) {
  ctx.save();
  ctx.fillStyle = "#0B0A09";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Borda clara bem sutil, para o disco não sumir no fundo escuro.
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sulcos: círculos bem finos e claros.
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1.5;
  for (let rr = 140; rr < r - 8; rr += 7) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Brilho: dois arcos largos e translúcidos, um de cada lado.
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 60;
  for (const start of [-Math.PI * 0.35, Math.PI * 0.65]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, start, start + Math.PI * 0.22);
    ctx.stroke();
  }

  // Selo com a capa.
  const lr = 125;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, lr, 0, Math.PI * 2);
  ctx.clip();
  cover(ctx, label, cx - lr, cy - lr, lr * 2, lr * 2, 0, 0);
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, lr + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = room;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
