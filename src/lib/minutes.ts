/**
 * Minutos ouvidos no período, estimados. O Last.fm não diz quanto tempo cada scrobble
 * durou, e buscar a duração de todas as músicas seria pedido demais. Então:
 * duração média das músicas mais ouvidas (pesando pelas vezes que tocaram) x total de scrobbles.
 * Funções puras, com teste em minutes.test.ts.
 */

/** Duração média de uma música quando não sabemos nenhuma (3 min 30 s). */
export const FALLBACK_TRACK_SECONDS = 210;

export type DurationSample = { plays: number; durationSec: number | null };

/** Minutos estimados para `total` scrobbles, a partir das durações conhecidas. */
export function estimateMinutes(total: number, samples: DurationSample[]): number {
  if (total <= 0) return 0;
  let seconds = 0;
  let plays = 0;
  for (const s of samples) {
    if (!s.durationSec || s.durationSec <= 0 || s.plays <= 0) continue;
    seconds += s.durationSec * s.plays;
    plays += s.plays;
  }
  const average = plays > 0 ? seconds / plays : FALLBACK_TRACK_SECONDS;
  return Math.round((total * average) / 60);
}
