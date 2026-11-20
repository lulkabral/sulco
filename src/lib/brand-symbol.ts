// Símbolo da marca (logo de novembro de 2026, brand/GUIA.md e docs/MARCA.md): disco âmbar
// com o "s" da DM Sans 800 dentro. O disco é a primeira letra: disco + "ulco" = "sulco".
// Os desenhos vêm de public/brand/simbolo.svg (caixa de 200 x 200, disco de raio 96 no centro).
// Usado no HTML (components/Logo.tsx) e no canvas (lib/canvas/brandmark.ts).

export const SYMBOL_AMBER = "#E8A13A";
/** Cor do "s" e do anel central. */
export const SYMBOL_DARK = "#14110E";

/** O "s" (DM Sans 800 em contorno) na caixa de 200 x 200. */
export const SYMBOL_S_PATH =
  "M101.04 151.58Q87.75 151.58 78.06 147.31Q68.36 143.03 62.85 135.72Q57.34 128.4 56.39 119.09H83Q83.75 122.51 85.94 125.27Q88.12 128.02 91.83 129.73Q95.53 131.44 100.66 131.44Q105.6 131.44 108.74 130.01Q111.88 128.59 113.49 126.31Q115.11 124.03 115.11 121.37Q115.11 117.57 112.82 115.48Q110.54 113.39 106.17 112.06Q101.81 110.73 95.72 109.59Q88.88 108.07 82.33 106.17Q75.78 104.27 70.55 101.14Q65.32 98 62.28 93.25Q59.24 88.5 59.24 81.47Q59.24 72.92 63.9 66.08Q68.55 59.24 77.39 55.25Q86.22 51.26 98.57 51.26Q116.05 51.26 126.22 59.15Q136.38 67.03 138.28 80.52H113.2Q112.25 76.34 108.45 74.06Q104.66 71.78 98.38 71.78Q91.92 71.78 88.41 74.06Q84.89 76.34 84.89 80.14Q84.89 82.61 87.17 84.61Q89.45 86.6 93.73 88.03Q98 89.45 104.28 90.78Q115.48 93.06 123.84 96.01Q132.2 98.95 136.95 104.37Q141.7 109.78 141.7 120.04Q141.89 129.16 136.86 136.38Q131.82 143.6 122.7 147.59Q113.58 151.58 101.04 151.58Z";

/** Centro e raio do disco na caixa de 200; anel escuro e furo âmbar do centro. */
export const SYMBOL_CENTER = 100;
export const SYMBOL_RADIUS = 96;
export const SYMBOL_RING_RADIUS = 13;
export const SYMBOL_HOLE_RADIUS = 5.5;
/** Recorte da caixa que contém só o disco (de 4 a 196). */
export const SYMBOL_DISC_VIEWBOX = "4 4 192 192";

/**
 * Proporções do lockup, em "em" da fonte do "ulco" (DM Sans 800, letter-spacing -0,05em):
 * diâmetro do disco, quanto a base do disco desce abaixo da linha de base e o espaço até o "u".
 * Com isso o topo do disco fica alinhado ao topo do "l".
 */
export const LOCKUP = { disc: 0.787, belowBaseline: 0.063, gap: 0.01, letterSpacing: -0.05 } as const;

/** Abaixo de 32 px o furo central vira ruído: usa a versão mini (sem furo). */
export const SYMBOL_MINI_BELOW_PX = 32;
