// Cores de vinil colorido que contrastam com a capa do álbum (para os discos da página inicial).

import { contrastRatio, rgbToHex, rgbToHsl, type Rgb } from "./recap/palettes";

export type VinylFinish = {
  id: string;
  /** Cor principal do vinil colorido (hex). */
  base: string;
  /** Matiz de referência (0–360) usado para escolher a cor mais contrastante com a capa. */
  hue: number;
};

/**
 * Edições coloridas de vinil (todas vibram tanto no palco escuro quanto na faixa terracota).
 * Evitamos vermelho-alaranjado para não sumir sobre o fundo terracota da vitrine.
 */
export const VINYL_FINISHES: readonly VinylFinish[] = [
  { id: "pink", base: "#FF5BB2", hue: 328 },
  { id: "turquoise", base: "#26C9DE", hue: 187 },
  { id: "cobalt", base: "#3D84FF", hue: 218 },
  { id: "lime", base: "#C8E836", hue: 71 },
  { id: "gold", base: "#F7C137", hue: 43 },
  { id: "mint", base: "#36D699", hue: 157 },
  { id: "violet", base: "#A875FF", hue: 263 },
  { id: "sky", base: "#58B8FF", hue: 205 },
] as const;

/** Superfície lisa com poucos sulcos bem sutis e borda suave (como um LP colorido liso). */
export const VINYL_GROOVES =
  "radial-gradient(circle, transparent 0 46%, rgba(0, 0, 0, 0.08) 46.5%, transparent 47.5%, transparent 64%, rgba(0, 0, 0, 0.06) 64.5%, transparent 65.5%, transparent 80%, rgba(0, 0, 0, 0.07) 80.5%, transparent 81.5%, transparent 94%, rgba(0, 0, 0, 0.12) 98%, rgba(0, 0, 0, 0.22) 100%)";
export const VINYL_SHEEN =
  "conic-gradient(from 28deg, transparent 0 10%, rgba(255, 255, 255, 0.16) 15%, transparent 22%, transparent 60%, rgba(255, 255, 255, 0.1) 65%, transparent 72%)";

/** Distância circular entre dois matizes, de 0° (iguais) a 180° (opostos). */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Hash simples e determinístico para desempatar capas neutras (preto e branco). */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Tom predominante visual da capa a partir dos pixels (RGBA, ex.: 24x24).
 * Diferente de `dominantColor` (que usa saturação² para puxar acentos vivos), aqui usamos
 * peso suave e valorizamos a moldura externa (onde o vinil encosta na capa): assim um fundo
 * azul-acinzentado grande não perde para um detalhe pequeno de pele ou brilho no centro.
 */
export function coverTone(pixels: ArrayLike<number>, width = 24, height = 24): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  let plainR = 0;
  let plainG = 0;
  let plainB = 0;
  let plainN = 0;

  const total = Math.floor(pixels.length / 4);
  for (let idx = 0; idx < total; idx++) {
    const off = idx * 4;
    const px = { r: pixels[off], g: pixels[off + 1], b: pixels[off + 2] };
    plainR += px.r;
    plainG += px.g;
    plainB += px.b;
    plainN += 1;

    const { s, l } = rgbToHsl(px);
    if (l < 0.12 || l > 0.84) continue;

    const x = idx % width;
    const y = Math.floor(idx / width);
    const onEdge = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
    const w = (0.3 + s * 0.7) * (onEdge ? 2.2 : 1);
    r += px.r * w;
    g += px.g * w;
    b += px.b * w;
    weight += w;
  }

  if (weight < 1) {
    const n = Math.max(plainN, 1);
    return { r: plainR / n, g: plainG / n, b: plainB / n };
  }
  return { r: r / weight, g: g / weight, b: b / weight };
}

/**
 * Escolhe a cor de vinil que melhor contrasta com o tom predominante da capa.
 * - Capas coloridas: prioriza matizes complementares/opostos (115°–180°) e contraste de brilho.
 * - Capas neutras (P&B / cinza): escolhe de forma determinística uma cor vibrante com bom
 *   contraste de brilho, evitando repetir cores já usadas na mesma vitrine.
 */
export function pickVinylFinish(
  coverRgb: Rgb,
  seed = "",
  used?: ReadonlySet<string>,
): VinylFinish {
  const available = used ? VINYL_FINISHES.filter((f) => !used.has(f.id)) : [];
  const pool = available.length > 0 ? available : VINYL_FINISHES;

  const { h, s } = rgbToHsl(coverRgb);
  const coverHex = rgbToHex(coverRgb);

  // Capa preta, branca ou quase cinza: não tem matiz forte — varia de forma determinística
  // dando preferência às cores que mais se destacam do claro/escuro da capa.
  if (s < 0.12) {
    const ranked = [...pool].sort(
      (a, b) => contrastRatio(b.base, coverHex) - contrastRatio(a.base, coverHex),
    );
    const top = ranked.slice(0, Math.min(4, ranked.length));
    return top[hashSeed(seed) % top.length];
  }

  let best = pool[0];
  let bestScore = -1;
  for (const finish of pool) {
    const dist = hueDistance(finish.hue, h);
    const hueScore = dist / 180;
    const splitBonus = dist >= 115 && dist <= 175 ? 0.08 : 0;
    const lumScore = Math.min(contrastRatio(finish.base, coverHex), 6) / 6;
    const score = hueScore * 0.72 + lumScore * 0.28 + splitBonus;
    if (score > bestScore) {
      bestScore = score;
      best = finish;
    }
  }
  return best;
}

/**
 * Atribui uma cor de vinil contrastante para cada item da vitrine sem repetir cores
 * enquanto houver opções disponíveis. Itens ainda sem cor carregada voltam como `null`.
 */
export function assignVinylFinishes(
  items: readonly { color: Rgb | null; seed: string }[],
): (VinylFinish | null)[] {
  const used = new Set<string>();
  return items.map(({ color, seed }) => {
    if (!color) return null;
    const picked = pickVinylFinish(color, seed, used);
    used.add(picked.id);
    return picked;
  });
}

/**
 * Lê o tom predominante de uma imagem já carregada com CORS (reduzida para 24x24 px).
 * Se o navegador recusar leitura dos pixels, devolve null.
 */
export function sampleCoverRgb(img: HTMLImageElement): Rgb | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 24, 24);
    return coverTone(ctx.getImageData(0, 0, 24, 24).data, 24, 24);
  } catch {
    return null;
  }
}
