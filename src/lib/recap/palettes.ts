// Paletas de cor da imagem do recap. Cada paleta define tudo junto (fundo, cartão,
// texto e destaque), para a imagem nunca ficar ilegível. Funções puras, com teste.

export type Palette = {
  id: string;
  name: string;
  /** Fundo da imagem. */
  room: string;
  /** Cartões. */
  card: string;
  /** Cartão em destaque / capa ausente. */
  card2: string;
  /** Linhas e trilhos das barras. */
  line: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  accent: string;
  /** Texto sobre o destaque. */
  accentInk: string;
};

export const PALETTES: readonly Palette[] = [
  {
    id: "ambar",
    name: "Âmbar",
    room: "#15120F",
    card: "#221D19",
    card2: "#2C2621",
    line: "#3A322C",
    ink: "#F4EEE6",
    inkSoft: "#B5ABA0",
    inkFaint: "#958B7F",
    accent: "#E8A13A",
    accentInk: "#2A1A05",
  },
  {
    id: "meia-noite",
    name: "Meia-noite",
    room: "#0E1424",
    card: "#18213A",
    card2: "#202B48",
    line: "#2C3A5E",
    ink: "#EEF2FF",
    inkSoft: "#A9B4D0",
    inkFaint: "#8E9AB8",
    accent: "#6FC3FF",
    accentInk: "#06223A",
  },
  {
    id: "vinho",
    name: "Vinho",
    room: "#1E0D14",
    card: "#2E1520",
    card2: "#3A1C29",
    line: "#4C2637",
    ink: "#FBEFF3",
    inkSoft: "#CDA9B7",
    inkFaint: "#B0899A",
    accent: "#FF7AA2",
    accentInk: "#3A0A1A",
  },
  {
    id: "papel",
    name: "Papel",
    room: "#F3EEE4",
    card: "#E8E0D2",
    card2: "#DCD2C1",
    line: "#CFC4B1",
    ink: "#1C1A17",
    inkSoft: "#57514A",
    inkFaint: "#6B655C",
    accent: "#A63A24",
    accentInk: "#FFF7EE",
  },
  {
    id: "lilas",
    name: "Lilás",
    room: "#17121F",
    card: "#241C30",
    card2: "#2E243D",
    line: "#3D3150",
    ink: "#F3EEFB",
    inkSoft: "#B9AECB",
    inkFaint: "#9C90B0",
    accent: "#C59BFF",
    accentInk: "#25104A",
  },
];

/** Paleta que nasce da capa do álbum nº 1 (calculada em `paletteFromColor`). */
export const COVER_PALETTE_ID = "capa";

export const DEFAULT_PALETTE_ID = "ambar";

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

// ---------- cores ----------

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** Matiz (0-360), saturação e luminosidade (0-1). */
export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/** Luminância relativa (WCAG). */
function luminance({ r, g, b }: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razão de contraste entre duas cores (1 a 21). Texto normal pede 4,5; texto grande, 3. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Cor dominante de uma imagem, a partir dos pixels (RGBA em sequência, como `getImageData`).
 * Pixels mais saturados pesam mais (o "cinza" de fundo de uma capa não deve ganhar).
 * Imagem toda cinza: devolve a média simples.
 */
export function dominantColor(pixels: ArrayLike<number>): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  let plain = { r: 0, g: 0, b: 0, n: 0 };
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const px = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
    plain = { r: plain.r + px.r, g: plain.g + px.g, b: plain.b + px.b, n: plain.n + 1 };
    const { s, l } = rgbToHsl(px);
    // Ignora quase preto e quase branco; peso = saturação ao quadrado.
    if (l < 0.12 || l > 0.92) continue;
    const w = s * s;
    r += px.r * w;
    g += px.g * w;
    b += px.b * w;
    weight += w;
  }
  if (weight < 0.5) {
    const n = Math.max(plain.n, 1);
    return { r: plain.r / n, g: plain.g / n, b: plain.b / n };
  }
  return { r: r / weight, g: g / weight, b: b / weight };
}

/**
 * Monta uma paleta escura tingida pela cor dada (ex.: a dominante da capa):
 * fundo e cartões levam um pouco do matiz, e o destaque é a própria cor,
 * clareada até ter contraste de pelo menos 4,5 com o cartão.
 */
export function paletteFromColor(color: Rgb): Palette {
  const { h, s } = rgbToHsl(color);
  const tint = Math.min(s, 0.35); // fundo só levemente tingido
  const hex = (l: number, sat = tint) => rgbToHex(hslToRgb(h, sat, l));

  const card = hex(0.12);
  const accentSat = Math.max(0.55, Math.min(s, 0.85));
  let l = 0.55;
  let accent = hex(l, accentSat);
  while (contrastRatio(accent, card) < 4.5 && l < 0.92) {
    l += 0.03;
    accent = hex(l, accentSat);
  }

  return {
    id: COVER_PALETTE_ID,
    name: "Cor da capa",
    room: hex(0.07),
    card,
    card2: hex(0.16),
    line: hex(0.22),
    ink: hex(0.95, 0.3),
    inkSoft: hex(0.74, 0.15),
    inkFaint: hex(0.64, 0.12),
    accent,
    accentInk: hex(0.1, 0.6),
  };
}
