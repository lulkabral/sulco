// Desenho do recap no formato story (1080 x 1920), direção visual "Encarte":
// papel creme, tinta quase preta, um destaque em vermelho-tijolo, serifada nos títulos.

import { truncateText, wrapText } from "@/lib/canvas/text";
import { formatNumber, formatPlays } from "@/lib/format";

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
  /** Ex.: "Últimos 30 dias" (na fase 6, "Outubro de 2026"). */
  title: string;
  /** Ex.: "16 out – 15 nov 2026". */
  dateRange: string;
  total: number;
  artists: RecapListItem[];
  tracks: RecapListItem[];
  albums: RecapListItem[];
  /** Álbum nº 1, com a capa já carregada (ou null se não tiver capa). */
  featured: (RecapListItem & { cover: HTMLImageElement | null }) | null;
  /** Top gêneros (fase 5). null = ainda não calculado. */
  genres: string[] | null;
  /** Endereço do site, mostrado no rodapé. */
  siteHost: string;
};

export type RecapFonts = { serif: string; sans: string };

const PAPER = "#F3EEE4";
const PAPER_DARK = "#E3DACB";
const INK = "#1C1A17";
const INK_SOFT = "#6B655C";
const ACCENT = "#B8432C";

const M = 80; // margem lateral
const INNER = RECAP_WIDTH - M * 2; // 920
const COL_GAP = 40;
const COL_W = (INNER - COL_GAP) / 2; // 440
const LIST_SIZE = 5;

type Ctx = CanvasRenderingContext2D;

export function drawRecap(canvas: HTMLCanvasElement, data: RecapData, fonts: RecapFonts): void {
  canvas.width = RECAP_WIDTH;
  canvas.height = RECAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, RECAP_WIDTH, RECAP_HEIGHT);
  ctx.textBaseline = "alphabetic";

  drawHeader(ctx, data, fonts);
  hRule(ctx, 320, 2);
  drawFeature(ctx, data, fonts, 356);
  hRule(ctx, 856, 2);

  const left = M;
  const right = M + COL_W + COL_GAP;
  vRule(ctx, M + COL_W + COL_GAP / 2, 896, 1266);
  drawList(ctx, fonts, left, 896, "Artistas", data.artists);
  drawList(ctx, fonts, right, 896, "Músicas", data.tracks);

  hRule(ctx, 1296, 1);
  vRule(ctx, M + COL_W + COL_GAP / 2, 1326, 1696);
  drawList(ctx, fonts, left, 1326, "Álbuns", data.albums);
  drawGenres(ctx, fonts, right, 1326, data.genres);

  hRule(ctx, 1764, 2);
  drawFooter(ctx, data, fonts, 1820);
}

// ---------- partes ----------

function drawHeader(ctx: Ctx, data: RecapData, fonts: RecapFonts) {
  eyebrow(ctx, fonts, "Recap", M, 124);

  ctx.font = `500 30px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  ctx.textAlign = "right";
  const user = truncateText(`@${data.username}`, INNER / 2, measureWith(ctx));
  ctx.fillText(user, M + INNER, 124);
  ctx.textAlign = "left";

  ctx.font = `600 88px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText(truncateText(data.title, INNER, measureWith(ctx)), M - 4, 226);

  ctx.font = `400 32px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText(data.dateRange, M, 278);
}

function drawFeature(ctx: Ctx, data: RecapData, fonts: RecapFonts, top: number) {
  const side = 460;
  const featured = data.featured;

  // Capa com "sombra" de papel deslocada, como um disco sobre a mesa.
  ctx.fillStyle = PAPER_DARK;
  ctx.fillRect(M + 14, top + 14, side, side);
  if (featured?.cover) {
    ctx.drawImage(featured.cover, M, top, side, side);
  } else {
    drawNoCover(ctx, fonts, M, top, side, featured);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(M + 1, top + 1, side - 2, side - 2);

  // Coluna da direita.
  const x = M + side + 60;
  const w = M + INNER - x; // 400
  const measure = measureWith(ctx);

  eyebrow(ctx, fonts, "Scrobbles", x, top + 30);
  const totalText = formatNumber(data.total);
  const size = fitFontSize(ctx, totalText, w, 120, 56, (px) => `600 ${px}px ${fonts.serif}`);
  ctx.font = `600 ${size}px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText(totalText, x - 2, top + 30 + 18 + size * 0.8);

  hRule(ctx, top + 190, 1, x, w);

  if (!featured) return;
  eyebrow(ctx, fonts, "Álbum nº 1", x, top + 240);

  // No máximo 2 linhas: com nome, artista e plays, o bloco termina na altura da capa.
  ctx.font = `500 42px ${fonts.serif}`;
  ctx.fillStyle = INK;
  let y = top + 294;
  for (const line of wrapText(featured.name, w, 2, measure)) {
    ctx.fillText(line, x, y);
    y += 50;
  }

  ctx.font = `400 28px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  if (featured.artist) {
    ctx.fillText(truncateText(featured.artist, w, measure), x, y + 2);
    y += 40;
  }
  ctx.fillStyle = ACCENT;
  ctx.fillText(formatPlays(featured.playcount), x, y + 2);
}

/** Capa ausente: quadrado de papel mais escuro com o nome do álbum. */
function drawNoCover(
  ctx: Ctx,
  fonts: RecapFonts,
  x: number,
  y: number,
  side: number,
  album: RecapListItem | null,
) {
  ctx.fillStyle = PAPER_DARK;
  ctx.fillRect(x, y, side, side);
  if (!album) return;
  ctx.font = `600 44px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  const lines = wrapText(album.name, side - 80, 4, measureWith(ctx));
  let cy = y + side / 2 - ((lines.length - 1) * 52) / 2 + 14;
  for (const line of lines) {
    ctx.fillText(line, x + side / 2, cy);
    cy += 52;
  }
  ctx.textAlign = "left";
}

function drawList(
  ctx: Ctx,
  fonts: RecapFonts,
  x: number,
  top: number,
  title: string,
  items: RecapListItem[],
) {
  eyebrow(ctx, fonts, title, x, top + 24);
  const measure = measureWith(ctx);
  const rankW = 46;

  items.slice(0, LIST_SIZE).forEach((item, i) => {
    const base = top + 80 + i * 66;

    ctx.font = `600 30px ${fonts.serif}`;
    ctx.fillStyle = ACCENT;
    ctx.fillText(String(i + 1), x, base);

    // Plays alinhados à direita, na linha do nome.
    ctx.font = `400 24px ${fonts.sans}`;
    ctx.fillStyle = INK_SOFT;
    ctx.textAlign = "right";
    const plays = formatNumber(item.playcount);
    ctx.fillText(plays, x + COL_W, base);
    ctx.textAlign = "left";
    const playsW = measure(plays) + 16;

    ctx.font = `600 30px ${fonts.sans}`;
    ctx.fillStyle = INK;
    ctx.fillText(truncateText(item.name, COL_W - rankW - playsW, measure), x + rankW, base);

    if (item.artist) {
      ctx.font = `400 24px ${fonts.sans}`;
      ctx.fillStyle = INK_SOFT;
      ctx.fillText(truncateText(item.artist, COL_W - rankW, measure), x + rankW, base + 30);
    }
  });
}

function drawGenres(ctx: Ctx, fonts: RecapFonts, x: number, top: number, genres: string[] | null) {
  eyebrow(ctx, fonts, "Gêneros", x, top + 24);
  if (!genres || genres.length === 0) {
    ctx.font = `italic 400 30px ${fonts.serif}`;
    ctx.fillStyle = INK_SOFT;
    ctx.fillText("em breve", x, top + 80);
    return;
  }
  const measure = measureWith(ctx);
  genres.slice(0, LIST_SIZE).forEach((genre, i) => {
    const base = top + 80 + i * 66;
    ctx.font = `600 30px ${fonts.serif}`;
    ctx.fillStyle = ACCENT;
    ctx.fillText(String(i + 1), x, base);
    ctx.font = `600 30px ${fonts.sans}`;
    ctx.fillStyle = INK;
    ctx.fillText(truncateText(genre, COL_W - 46, measure), x + 46, base);
  });
}

function drawFooter(ctx: Ctx, data: RecapData, fonts: RecapFonts, baseline: number) {
  ctx.font = `400 26px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText("dados: Last.fm", M, baseline);
  ctx.textAlign = "right";
  ctx.fillText(truncateText(data.siteHost, INNER / 2, measureWith(ctx)), M + INNER, baseline);
  ctx.textAlign = "left";
}

// ---------- ajudantes ----------

function measureWith(ctx: Ctx) {
  return (s: string) => ctx.measureText(s).width;
}

/** Rótulo pequeno em maiúsculas, espaçado, na cor de destaque. */
function eyebrow(ctx: Ctx, fonts: RecapFonts, text: string, x: number, baseline: number) {
  ctx.font = `600 24px ${fonts.sans}`;
  ctx.fillStyle = ACCENT;
  ctx.letterSpacing = "4px"; // navegadores sem suporte ignoram
  ctx.fillText(text.toLocaleUpperCase("pt-BR"), x, baseline);
  ctx.letterSpacing = "0px";
}

function hRule(ctx: Ctx, y: number, width: number, x = M, w = INNER) {
  ctx.fillStyle = INK;
  ctx.fillRect(x, y - width / 2, w, width);
}

function vRule(ctx: Ctx, x: number, y1: number, y2: number) {
  ctx.fillStyle = PAPER_DARK;
  ctx.fillRect(x - 1, y1, 2, y2 - y1);
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
