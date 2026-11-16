/** Tamanhos de grade oferecidos na tela (3 = 3x3 etc.). */
export const GRID_SIZES = [3, 4, 5] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/** Lado da imagem final, em pixels. Divisível por 3, 4 e 5. */
export const GRID_CANVAS_SIDE = 1500;

export type GridCell = {
  /** Posição na ordem do top (0 = álbum mais ouvido). */
  index: number;
  x: number;
  y: number;
  side: number;
};

/** Posição de cada quadrado da grade, linha por linha, da esquerda para a direita. */
export function gridLayout(size: GridSize, canvasSide = GRID_CANVAS_SIDE): GridCell[] {
  const side = canvasSide / size;
  const cells: GridCell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({ index: row * size + col, x: col * side, y: row * side, side });
    }
  }
  return cells;
}

/**
 * Pede a capa no tamanho `px` trocando o trecho de tamanho no endereço
 * (ex.: `/300x300/` ou `/174s/` -> `/600x600/`). Ver armadilha 9 em docs/LASTFM.md.
 * Endereço sem trecho reconhecido volta igual.
 */
export function coverUrl(url: string, px: number): string {
  return url.replace(/\/i\/u\/(?:\d+x\d+|\d+s)\//, `/i/u/${px}x${px}/`);
}

/**
 * Versão miniatura (174 px) da capa ou do avatar, para mostrar na tela (faixa do topo, avatar).
 * Atenção: o Last.fm só tem `174s`; `174x174` devolve o ORIGINAL (vários MB). Armadilha 9.
 */
export function thumbUrl(url: string): string {
  return url.replace(/\/i\/u\/(?:\d+x\d+|\d+s)\//, "/i/u/174s/");
}

/** Tamanho da capa a pedir para um quadrado de `side` px (300 ou 600, os que o Last.fm tem). */
export function coverPxFor(side: number): 300 | 600 {
  return side > 300 ? 600 : 300;
}
