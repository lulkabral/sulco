// Disposição do banner do X (1500 x 500) da conta oficial do sulco.
// Função pura: só calcula posições; quem desenha é o script scripts/banner.ts.

export const BANNER_W = 1500;
export const BANNER_H = 500;
export const MAX_COVERS = 10;

/**
 * Faixas que o X pode cortar no celular (em cima e embaixo): nada importante entra nelas.
 * Medidas conservadoras, em px do banner de 1500 x 500.
 */
export const SAFE_TOP = 60;
export const SAFE_BOTTOM = BANNER_H - 60;

/** Canto que o avatar do X tampa (inferior esquerdo). Fica vazio. */
export const AVATAR_ZONE = { x: 0, y: 280, w: 460, h: BANNER_H - 280 };

export type Rect = { x: number; y: number; w: number; h: number };

export type BannerLayout = {
  /** Logo: canto superior esquerdo da caixa e tamanho da fonte do "ulco". */
  logo: { x: number; baseline: number; fontPx: number };
  /** Título e subtítulo: posição da linha de base. */
  title: { x: number; baseline: number; fontPx: number; maxWidth: number };
  subtitle: { x: number; baseline: number; fontPx: number; maxWidth: number };
  /** Uma posição por capa, na ordem em que aparecem (linha por linha). */
  covers: Rect[];
  /** Raio dos cantos das capas. */
  radius: number;
};

/**
 * Capas em até 2 fileiras de 5, à direita e centralizadas na altura;
 * logo, título e subtítulo à esquerda, no alto (longe do avatar).
 */
export function bannerLayout(coverCount: number): BannerLayout {
  const count = Math.max(0, Math.min(coverCount, MAX_COVERS));
  const side = 170;
  const gap = 14;
  const cols = 5;
  const rows = count > cols ? 2 : 1;
  const gridW = cols * side + (cols - 1) * gap;
  const gridH = rows * side + (rows - 1) * gap;
  const x0 = BANNER_W - 60 - gridW;
  const y0 = Math.round((BANNER_H - gridH) / 2);

  const covers: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    covers.push({ x: x0 + col * (side + gap), y: y0 + row * (side + gap), w: side, h: side });
  }

  const textX = 64;
  const textW = x0 - textX - 40;
  return {
    logo: { x: textX, baseline: 126, fontPx: 54 },
    title: { x: textX, baseline: 204, fontPx: 46, maxWidth: textW },
    subtitle: { x: textX, baseline: 248, fontPx: 26, maxWidth: textW },
    covers,
    radius: 14,
  };
}

/** Os dois retângulos se encostam? */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
