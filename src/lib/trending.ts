/**
 * Capas "em alta no mundo" da página inicial: vêm do top de músicas global do Last.fm
 * (`chart.getTopTracks`) + a capa do álbum de cada música (`track.getInfo`).
 * Função pura, com teste em trending.test.ts.
 */

export type TrendingCover = { imageUrl: string; name: string; artist: string };

/** Quantas capas a colagem usa. */
export const TRENDING_COVERS = 12;

/** Tira músicas sem capa e capas repetidas (duas músicas do mesmo álbum), na ordem do top. */
export function pickTrendingCovers(
  tracks: { name: string; artist: string; imageUrl: string | null }[],
  max = TRENDING_COVERS,
): TrendingCover[] {
  const seen = new Set<string>();
  const out: TrendingCover[] = [];
  for (const t of tracks) {
    if (!t.imageUrl || seen.has(t.imageUrl)) continue;
    seen.add(t.imageUrl);
    out.push({ imageUrl: t.imageUrl, name: t.name, artist: t.artist });
    if (out.length >= max) break;
  }
  return out;
}
