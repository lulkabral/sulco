// Desenho do recap no formato story (1080 x 1920), identidade "Sala escura":
// fundo preto quente, cartões escuros, Geist pesada e um único destaque âmbar.
// No topo, uma fileira com as capas mais ouvidas (como as faixas do site).

import { truncateText, wrapText } from "@/lib/canvas/text";
import { formatNumber, formatPlays } from "@/lib/format";
import { THEME, TILE_COLORS } from "@/lib/theme";

export const RECAP_WIDTH = 1080;
export const RECAP_HEIGHT = 1920;

export type RecapListItem = {
  name: string;
  /** Artista, para músicas e álbuns. */
  artist?: string;
  playcount: number;
};

export type RecapData = {
  username: string;
  /** Ex.: "Últimos 30 dias" ou "Outubro de 2026". */
  title: string;
  /** Ex.: "1 – 31 out 2026". */
  dateRange: string;
  total: number;
  artists: RecapListItem[];
  tracks: RecapListItem[];
  albums: RecapListItem[];
  /** Álbum nº 1, com a capa já carregada (ou null se não tiver capa). */
  featured: (RecapListItem & { cover: HTMLImageElement | null }) | null;
  /** Capas da fileira do topo (álbuns 1 a 5; null onde não houver capa). */
  stripCovers: (HTMLImageElement | null)[];
  /** Top gêneros. null = não deu para calcular; [] = artistas sem tags. */
  genres: string[] | null;
  /** Endereço do site, mostrado no rodapé. */
  siteHost: string;
};

export type RecapFonts = { sans: string };

const M = 80; // margem lateral
const INNER = RECAP_WIDTH - M * 2; // 920
const GAP = 24;
const COL_W = (INNER - GAP) / 2; // 448
const LIST_SIZE = 5;

type Ctx = CanvasRenderingContext2D;

export function drawRecap(canvas: HTMLCanvasElement, data: RecapData, fonts: RecapFonts): void {
  canvas.width = RECAP_WIDTH;
  canvas.height = RECAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const f = fonts.sans;

  ctx.fillStyle = THEME.room;
  ctx.fillRect(0, 0, RECAP_WIDTH, RECAP_HEIGHT);
  ctx.textBaseline = "alphabetic";

  drawStrip(ctx, data.stripCovers);
  drawHeader(ctx, data, f);
  drawFeature(ctx, data, f, 460);

  drawListCard(ctx, f, M, 900, "Artistas", data.artists);
  drawListCard(ctx, f, M + COL_W + GAP, 900, "Músicas", data.tracks);
  drawListCard(ctx, f, M, 1334, "Álbuns", data.albums);
  drawGenresCard(ctx, f, M + COL_W + GAP, 1334, data.genres);

  drawFooter(ctx, data, f, 1840);
}

// ---------- partes ----------

/** Fileira de 5 capas no topo, cortada em cima e sumindo no fundo embaixo. */
function drawStrip(ctx: Ctx, covers: (HTMLImageElement | null)[]) {
  const side = 200;
  const gap = 20;
  for (let i = 0; i < 5; i++) {
    const x = i * (side + gap);
    const y = -40;
    ctx.save();
    roundRect(ctx, x, y, side, side, 20);
    ctx.clip();
    const cover = covers[i];
    if (cover) {
      ctx.drawImage(cover, x, y, side, side);
    } else {
      ctx.fillStyle = TILE_COLORS[(i * 3) % TILE_COLORS.length];
      ctx.fillRect(x, y, side, side);
    }
    ctx.restore();
  }
  // Escurece de cima para baixo: as capas "afundam" no fundo.
  const fade = ctx.createLinearGradient(0, 20, 0, 200);
  fade.addColorStop(0, "rgba(21,18,15,0.15)");
  fade.addColorStop(1, THEME.room);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, RECAP_WIDTH, 200);
}

function drawHeader(ctx: Ctx, data: RecapData, f: string) {
  eyebrow(ctx, f, `Recap · @${data.username}`, M, 256, THEME.amber, INNER);

  const size = fitFontSize(ctx, data.title, INNER, 104, 64, (px) => `800 ${px}px ${f}`);
  ctx.font = `800 ${size}px ${f}`;
  ctx.fillStyle = THEME.ink;
  ctx.letterSpacing = "-2px";
  ctx.fillText(truncateText(data.title, INNER, measureWith(ctx)), M - 4, 352);
  ctx.letterSpacing = "0px";

  ctx.font = `500 32px ${f}`;
  ctx.fillStyle = THEME.inkSoft;
  ctx.fillText(data.dateRange, M, 408);
}

/** Cartão grande: capa do álbum nº 1, total de scrobbles e nome do álbum. */
function drawFeature(ctx: Ctx, data: RecapData, f: string, top: number) {
  const h = 400;
  card(ctx, M, top, INNER, h, 36);

  const pad = 40;
  const side = h - pad * 2; // 320
  const featured = data.featured;
  ctx.save();
  roundRect(ctx, M + pad, top + pad, side, side, 20);
  ctx.clip();
  if (featured?.cover) {
    ctx.drawImage(featured.cover, M + pad, top + pad, side, side);
  } else {
    ctx.fillStyle = THEME.card2;
    ctx.fillRect(M + pad, top + pad, side, side);
    if (featured) {
      ctx.font = `800 34px ${f}`;
      ctx.fillStyle = THEME.ink;
      ctx.textAlign = "center";
      const lines = wrapText(featured.name, side - 48, 4, measureWith(ctx));
      let y = top + pad + side / 2 - ((lines.length - 1) * 40) / 2 + 12;
      for (const line of lines) {
        ctx.fillText(line, M + pad + side / 2, y);
        y += 40;
      }
      ctx.textAlign = "left";
    }
  }
  ctx.restore();

  const x = M + pad + side + 40; // 480
  const w = M + INNER - pad - x; // 440
  const measure = measureWith(ctx);

  eyebrow(ctx, f, "Scrobbles", x, top + 76, THEME.inkSoft, w);
  const totalText = formatNumber(data.total);
  const size = fitFontSize(ctx, totalText, w, 128, 56, (px) => `800 ${px}px ${f}`);
  ctx.font = `800 ${size}px ${f}`;
  ctx.fillStyle = THEME.amber;
  ctx.letterSpacing = "-3px";
  ctx.fillText(totalText, x - 4, top + 96 + size * 0.78);
  ctx.letterSpacing = "0px";

  if (!featured) return;
  eyebrow(ctx, f, "Álbum nº 1", x, top + 270, THEME.inkSoft, w);
  ctx.font = `700 34px ${f}`;
  ctx.fillStyle = THEME.ink;
  const lines = wrapText(featured.name, w, 2, measure);
  let y = top + 314;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += 40;
  }
  ctx.font = `500 26px ${f}`;
  ctx.fillStyle = THEME.inkSoft;
  const sub = featured.artist
    ? `${featured.artist} · ${formatPlays(featured.playcount)}`
    : formatPlays(featured.playcount);
  ctx.fillText(truncateText(sub, w, measure), x, y + 4);
}

function drawListCard(ctx: Ctx, f: string, x: number, top: number, title: string, items: RecapListItem[]) {
  card(ctx, x, top, COL_W, 410, 32);
  const pad = 32;
  const inner = COL_W - pad * 2;
  const left = x + pad;
  eyebrow(ctx, f, title, left, top + 58, THEME.inkSoft, inner);
  const measure = measureWith(ctx);
  const rankW = 44;

  items.slice(0, LIST_SIZE).forEach((item, i) => {
    const base = top + 120 + i * 58;

    ctx.font = `800 30px ${f}`;
    ctx.fillStyle = THEME.amber;
    ctx.fillText(String(i + 1), left, base);

    // Artistas: só o nome, com os plays na linha de baixo.
    // Músicas e álbuns: plays à direita do nome, artista na linha de baixo.
    let nameWidth = inner - rankW;
    if (item.artist) {
      ctx.font = `600 22px ${f}`;
      ctx.fillStyle = THEME.inkFaint;
      ctx.textAlign = "right";
      const plays = formatNumber(item.playcount);
      ctx.fillText(plays, left + inner, base);
      ctx.textAlign = "left";
      nameWidth -= measure(plays) + 14;
    }

    ctx.font = `700 28px ${f}`;
    ctx.fillStyle = THEME.ink;
    ctx.fillText(truncateText(item.name, nameWidth, measure), left + rankW, base);

    ctx.font = `500 22px ${f}`;
    ctx.fillStyle = THEME.inkSoft;
    const sub = item.artist ?? formatPlays(item.playcount);
    ctx.fillText(truncateText(sub, inner - rankW, measure), left + rankW, base + 28);
  });
}

function drawGenresCard(ctx: Ctx, f: string, x: number, top: number, genres: string[] | null) {
  card(ctx, x, top, COL_W, 410, 32);
  const pad = 32;
  const inner = COL_W - pad * 2;
  const left = x + pad;
  eyebrow(ctx, f, "Gêneros", left, top + 58, THEME.inkSoft, inner);

  if (!genres || genres.length === 0) {
    ctx.font = `500 26px ${f}`;
    ctx.fillStyle = THEME.inkSoft;
    ctx.fillText(genres ? "sem tags suficientes" : "indisponível", left, top + 120);
    return;
  }
  const measure = measureWith(ctx);
  genres.slice(0, LIST_SIZE).forEach((genre, i) => {
    const base = top + 120 + i * 58;
    ctx.font = `800 30px ${f}`;
    ctx.fillStyle = THEME.amber;
    ctx.fillText(String(i + 1), left, base);
    ctx.font = `700 28px ${f}`;
    ctx.fillStyle = THEME.ink;
    ctx.fillText(truncateText(genre, inner - 44, measure), left + 44, base);
    // Barrinha decrescente, como na página.
    ctx.fillStyle = THEME.line;
    roundRect(ctx, left + 44, base + 14, inner - 44, 6, 3);
    ctx.fill();
    ctx.fillStyle = i === 0 ? THEME.amber : "rgba(232,161,58,0.6)";
    roundRect(ctx, left + 44, base + 14, (inner - 44) * (1 - i * 0.16), 6, 3);
    ctx.fill();
  });
}

function drawFooter(ctx: Ctx, data: RecapData, f: string, baseline: number) {
  ctx.font = `500 26px ${f}`;
  ctx.fillStyle = THEME.inkFaint;
  ctx.fillText("dados: Last.fm", M, baseline);
  ctx.textAlign = "right";
  ctx.font = `700 26px ${f}`;
  ctx.fillStyle = THEME.inkSoft;
  ctx.fillText(truncateText(data.siteHost, INNER / 2, measureWith(ctx)), M + INNER, baseline);
  ctx.textAlign = "left";
}

// ---------- ajudantes ----------

function measureWith(ctx: Ctx) {
  return (s: string) => ctx.measureText(s).width;
}

/** Rótulo pequeno em maiúsculas e espaçado. */
function eyebrow(ctx: Ctx, f: string, text: string, x: number, baseline: number, color: string, maxWidth: number) {
  ctx.font = `700 24px ${f}`;
  ctx.fillStyle = color;
  ctx.letterSpacing = "4px"; // navegadores sem suporte ignoram
  ctx.fillText(truncateText(text.toLocaleUpperCase("pt-BR"), maxWidth, measureWith(ctx)), x, baseline);
  ctx.letterSpacing = "0px";
}

function card(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = THEME.card;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Maior tamanho de fonte (entre max e min) em que o texto cabe na largura. */
function fitFontSize(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  max: number,
  min: number,
  font: (px: number) => string,
): number {
  for (let px = max; px > min; px -= 4) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= maxWidth) return px;
  }
  return min;
}
