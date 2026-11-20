// Formato "Toca-discos": a capa do álbum nº 1 na frente, as capas 2 e 3 inclinadas
// atrás, e um vinil saindo da capa com ela mesma como selo. Embaixo, nomes sem números.

import { DICTS } from "@/i18n";
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

  // Vinil saindo pela direita (preto clássico por padrão ou colorido contrastante quando escolhido).
  vinyl(ctx, d.covers[0] ?? null, 700, SLEEVE_Y + SLEEVE / 2, 330, p.accent, p.room, o.vinylColor ?? null);

  // Capa da frente (álbum nº 1).
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  // Sombra não segue a escala do canvas: multiplica pela escala atual (1,5x na exportação).
  const k = ctx.getTransform().a;
  ctx.shadowBlur = 40 * k;
  ctx.shadowOffsetY = 20 * k;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(SLEEVE_X, SLEEVE_Y, SLEEVE, SLEEVE, 14);
  ctx.fill();
  ctx.restore();
  cover(ctx, d.covers[0] ?? null, SLEEVE_X, SLEEVE_Y, SLEEVE, SLEEVE, 14, 0);

  // Título e datas.
  const size = fitFontSize(ctx, d.title, INNER, 104, 60, (px) => `800 ${px}px ${f}`);
  // Acima do título fica o espaço do acento (Ú, Í, Ô): a linha de cima sobe junto com o tamanho.
  eyebrow(ctx, f, o.showUsername === false ? DICTS[o.lang].canvas.recapAnon : `@${d.username}`, M, 920 - size - ACCENT_ROOM, p.accent, INNER);
  text(ctx, d.title, M - 4, 920, { font: `800 ${size}px ${f}`, color: p.ink, maxWidth: INNER, spacing: -2 });
  dateLine(ctx, d, o, M, 978);

  // O álbum.
  const album = d.albums[0];
  if (album) {
    eyebrow(ctx, f, d.albumHeading, M, 1070, p.inkSoft, INNER);
    const y = lines(ctx, album.name, M, 1134, { font: `800 56px ${f}`, color: p.ink, maxWidth: INNER, maxLines: 2, lineHeight: 62 });
    const sub = [album.artist, o.showNumbers ? formatPlays(album.playcount, o.lang) : null].filter(Boolean).join(" · ");
    if (sub) text(ctx, sub, M, y + 2, { font: `500 34px ${f}`, color: p.inkSoft, maxWidth: INNER });
  }

  // Duas colunas de nomes.
  const colW = (INNER - 40) / 2;
  nameColumn(ctx, o, DICTS[o.lang].canvas.inYourHead, d.artists.slice(0, 5), M, 1340, colW, 34);
  nameColumn(ctx, o, DICTS[o.lang].canvas.onRepeat, d.tracks.slice(0, 5), M + colW + 40, 1340, colW, 30);

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
  const k = ctx.getTransform().a; // sombra não segue a escala do canvas
  ctx.shadowBlur = 30 * k;
  ctx.shadowOffsetY = 12 * k;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(-SLEEVE / 2, -SLEEVE / 2, SLEEVE, SLEEVE, 14);
  ctx.fill();
  ctx.shadowColor = "transparent";
  cover(ctx, img, -SLEEVE / 2, -SLEEVE / 2, SLEEVE, SLEEVE, 14, index);
  ctx.restore();
}

/** Disco de vinil: preto clássico (padrão) ou edição colorida lisa com poucos sulcos sutis. */
function vinyl(
  ctx: Ctx,
  label: HTMLImageElement | null,
  cx: number,
  cy: number,
  r: number,
  accent: string,
  room: string,
  vinylColor: string | null,
) {
  ctx.save();
  ctx.fillStyle = vinylColor ?? "#0B0A09";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  if (vinylColor) {
    // Vinil colorido: acabamento liso com borda sutil e poucos sulcos delicados (como na referência).
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    for (const ratio of [0.52, 0.69, 0.85]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 48;
    for (const start of [-Math.PI * 0.34, Math.PI * 0.66]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, start, start + Math.PI * 0.2);
      ctx.stroke();
    }
  } else {
    // Vinil preto clássico (intacto): borda clara sutil, sulcos e brilho.
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1.5;
    for (let rr = 140; rr < r - 8; rr += 7) {
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 60;
    for (const start of [-Math.PI * 0.35, Math.PI * 0.65]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, start, start + Math.PI * 0.22);
      ctx.stroke();
    }
  }

  // Selo com a capa.
  const lr = 125;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, lr, 0, Math.PI * 2);
  ctx.clip();
  cover(ctx, label, cx - lr, cy - lr, lr * 2, lr * 2, 0, 0);
  ctx.restore();

  if (vinylColor) {
    // No disco colorido, o selo assenta limpo sem anel amarelo brigando com a cor do vinil.
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, lr + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#120F0D";
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, lr + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = room;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
