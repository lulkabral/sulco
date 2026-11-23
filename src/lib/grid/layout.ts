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

/** Formato da grade: quadrada (feed) ou vertical 9:16 (Stories do Instagram). */
export type GridFormat = "square" | "stories";

/** Colunas oferecidas nos Stories (5 colunas daria capas pequenas demais no celular). */
export const STORIES_COLUMNS = [3, 4] as const;
export type StoriesColumns = (typeof STORIES_COLUMNS)[number];

/** Layout dos Stories: 1080 x 1920 (9:16), exportado em 1,5x = 1620 x 2880, como o recap. */
export const STORIES_WIDTH = 1080;
export const STORIES_HEIGHT = 1920;
export const STORIES_SCALE = 1.5;

/**
 * Linhas por número de colunas: 3x5 = 15 álbuns, 4x6 = 24 (a página busca até 25).
 * A sobra de altura vira uma faixa de fundo em cima e embaixo, onde o Instagram
 * põe a barra de progresso e o campo de resposta.
 */
const STORIES_ROWS: Record<StoriesColumns, number> = { 3: 5, 4: 6 };

/** Linhas da grade de Stories com `cols` colunas. */
export function storiesRows(cols: StoriesColumns): number {
  return STORIES_ROWS[cols];
}

/** Colunas válidas nos Stories: a 5x5 do quadrado vira 4 colunas. */
export function storiesColumns(size: GridSize): StoriesColumns {
  return size === 5 ? 4 : size;
}

/** Posição de cada quadrado da grade de Stories, centralizada na vertical, linha por linha. */
export function storiesLayout(cols: StoriesColumns): GridCell[] {
  const side = STORIES_WIDTH / cols;
  const rows = storiesRows(cols);
  const top = (STORIES_HEIGHT - rows * side) / 2;
  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ index: row * cols + col, x: col * side, y: top + row * side, side });
    }
  }
  return cells;
}

/** Medidas do layout e escala de exportação de cada formato. */
export function gridFrame(format: GridFormat): { width: number; height: number; scale: number } {
  return format === "stories"
    ? { width: STORIES_WIDTH, height: STORIES_HEIGHT, scale: STORIES_SCALE }
    : { width: GRID_SIDE, height: GRID_SIDE, scale: GRID_SCALE };
}

/** Quadrados da grade no formato escolhido (`size` = 3, 4 ou 5 colunas). */
export function gridCells(size: GridSize, format: GridFormat): GridCell[] {
  return format === "stories" ? storiesLayout(storiesColumns(size)) : gridLayout(size);
}

/** Tamanhos de capa que o Last.fm entrega: 300, 600 ou a original (1200 a 3000 px, mais pesada). */
export type CoverSize = 300 | 600 | "original";

const DEEZER_SIZE_PATH = /^(https:\/\/[a-z0-9.-]*dzcdn\.net\/images\/(?:cover|artist)\/[0-9a-f]{32}\/)\d+x\d+(-\d+-\d+-\d+-\d+\.\w+)$/i;

/**
 * Pede a capa no tamanho `px` trocando o trecho de tamanho no endereço:
 * - Last.fm: `/300x300/` ou `/174s/` -> `/600x600/` ("original" tira o trecho);
 * - Deezer: `/500x500-...` -> `/600x600-...` ("original" usa `1000x1000`, máximo da CDN).
 * Endereço sem trecho reconhecido volta igual.
 */
export function coverUrl(url: string, px: CoverSize): string {
  if (DEEZER_SIZE_PATH.test(url)) {
    const dim = px === "original" ? "1000x1000" : `${px}x${px}`;
    return url.replace(DEEZER_SIZE_PATH, `$1${dim}$2`);
  }
  const size = px === "original" ? "" : `${px}x${px}/`;
  return url.replace(/\/i\/u\/(?:\d+x\d+|\d+s)\//, `/i/u/${size}`);
}

/**
 * Versão miniatura para tela (174s no Last.fm, 250x250 na Deezer — tamanho `medium` já em cache na CDN).
 * Atenção: o Last.fm só tem `174s`; `174x174` devolve o ORIGINAL (vários MB). Armadilha 9.
 */
export function thumbUrl(url: string): string {
  if (DEEZER_SIZE_PATH.test(url)) {
    return url.replace(DEEZER_SIZE_PATH, "$1250x250$2");
  }
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
