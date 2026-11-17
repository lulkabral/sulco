// Imagem do recap no formato story (1080 x 1920). Cada formato fica num arquivo em
// ./layouts; este arquivo só define os dados comuns e escolhe qual desenhar.

import { drawClassic } from "./layouts/classic";
import { drawLineup } from "./layouts/lineup";
import { drawMosaic } from "./layouts/mosaic";
import { drawTurntable } from "./layouts/turntable";
import { H, W } from "./helpers";
import type { Palette } from "./palettes";

export const RECAP_WIDTH = W;
export const RECAP_HEIGHT = H;

export const RECAP_LAYOUTS = [
  { id: "toca-discos", name: "Toca-discos" },
  { id: "mosaico", name: "Mosaico" },
  { id: "lineup", name: "Lineup" },
  { id: "classico", name: "Clássico" },
] as const;
export type RecapLayoutId = (typeof RECAP_LAYOUTS)[number]["id"];
export const DEFAULT_LAYOUT: RecapLayoutId = "toca-discos";

export function isLayoutId(value: unknown): value is RecapLayoutId {
  return RECAP_LAYOUTS.some((l) => l.id === value);
}

export type RecapListItem = {
  name: string;
  /** Artista, para músicas e álbuns. */
  artist?: string;
  playcount: number;
};

export type RecapData = {
  username: string;
  /** Ex.: "Outubro de 2026", "Últimos 30 dias", "Todo o tempo". */
  title: string;
  /** Ex.: "1 – 31 out 2026" ou "desde março de 2019". */
  dateText: string;
  /** Rótulo curtinho do período, para o bloco do mosaico (ex.: "OUT 26", "7 DIAS"). */
  shortTag: string;
  /** Total de scrobbles do período (só aparece com "mostrar scrobbles"). */
  total: number;
  /** Minutos ouvidos, estimados (src/lib/minutes.ts); null enquanto não calculados. */
  minutes: number | null;
  /** Ex.: "O álbum do mês", "O álbum da sua vida". */
  albumHeading: string;
  /** Até 15 (o Lineup usa todos; os outros, 5). */
  artists: RecapListItem[];
  tracks: RecapListItem[];
  /** Até 9 álbuns; `covers[i]` é a capa de `albums[i]` (null se não houver). */
  albums: RecapListItem[];
  covers: (HTMLImageElement | null)[];
  /** Top gêneros. undefined = ainda calculando; null = não deu para calcular; [] = artistas sem tags. */
  genres: string[] | null | undefined;
  /** Endereço do site, mostrado no rodapé. */
  siteHost: string;
};

export type RecapOptions = {
  layout: RecapLayoutId;
  palette: Palette;
  /** Mostrar total de scrobbles, minutos e reproduções (desligado por padrão: lembrar, não medir). */
  showNumbers: boolean;
  /** Família da fonte (Geist), já carregada. */
  font: string;
};

const DRAW: Record<RecapLayoutId, (ctx: CanvasRenderingContext2D, d: RecapData, o: RecapOptions) => void> = {
  classico: drawClassic,
  "toca-discos": drawTurntable,
  mosaico: drawMosaic,
  lineup: drawLineup,
};

export function drawRecap(canvas: HTMLCanvasElement, data: RecapData, options: RecapOptions): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = options.palette.room;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";
  DRAW[options.layout](ctx, data, options);
}
