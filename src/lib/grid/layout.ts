/** Tamanhos de grade oferecidos na tela (3 = 3x3 etc.). */
export const GRID_SIZES = [3, 4, 5] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/** Lado do layout da grade. Divisível por 3, 4 e 5. */
export const GRID_SIDE = 1500;
/**
 * A grade é exportada em 2400 x 2400 (1,6x): nítida no zoom sem exagerar no peso. 2400 é
 * divisível por 3, 4 e 5, então cada capa cai em pixel inteiro (sem fresta entre as capas).
 */
export const GRID_SCALE = 1.6;
/** Lado da imagem final, em pixels. */
export const GRID_CANVAS_SIDE = GRID_SIDE * GRID_SCALE;

export type GridCell = {
  /** Posição na ordem do top (0 = álbum mais ouvido). */
  index: number;
  x: number;
  y: number;
  side: number;
};

/** Posição de cada quadrado da grade, linha por linha, da esquerda para a direita. */
export function gridLayout(size: GridSize, canvasSide = GRID_SIDE): GridCell[] {
  const side = canvasSide / size;
  const cells: GridCell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({ index: row * size + col, x: col * side, y: row * side, side });
    }
  }
  return cells;
}

/** Tamanhos de capa que o Last.fm entrega: 300, 600 ou a original (1200 a 3000 px, mais pesada). */
export type CoverSize = 300 | 600 | "original";

/**
 * Pede a capa no tamanho `px` trocando o trecho de tamanho no endereço
 * (ex.: `/300x300/` ou `/174s/` -> `/600x600/`); "original" tira o trecho.
 * Ver armadilha 9 em docs/LASTFM.md. Endereço sem trecho reconhecido volta igual.
 */
export function coverUrl(url: string, px: CoverSize): string {
  const size = px === "original" ? "" : `${px}x${px}/`;
  return url.replace(/\/i\/u\/(?:\d+x\d+|\d+s)\//, `/i/u/${size}`);
}

/**
 * Versão miniatura (174 px) da capa ou do avatar, para mostrar na tela (faixa do topo, avatar).
 * Atenção: o Last.fm só tem `174s`; `174x174` devolve o ORIGINAL (vários MB). Armadilha 9.
 */
export function thumbUrl(url: string): string {
  return url.replace(/\/i\/u\/(?:\d+x\d+|\d+s)\//, "/i/u/174s/");
}

/**
 * Tamanho da capa a pedir para um quadrado de `side` px na imagem final: 300, 600 ou, acima
 * disso, a original (o Last.fm não tem tamanho fixo entre 600 e a original).
 */
export function coverPxFor(side: number): CoverSize {
  if (side <= 300) return 300;
  if (side <= 600) return 600;
  return "original";
}

/** Capas do recap que pedem a original: só a nº 1 (a capa principal, a maior em todos os formatos). */
const RECAP_LARGE_COVERS = 1;

/** Tamanho da capa nº `index` (0 = mais ouvida) no recap exportado em 1,5x: a principal pede a original. */
export function recapCoverPx(index: number): CoverSize {
  return index < RECAP_LARGE_COVERS ? "original" : 600;
}
