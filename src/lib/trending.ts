/**
 * Capas "álbuns em alta no mundo" da página inicial. O Last.fm não tem ranking de álbuns
 * global, então montamos um: top 50 músicas global (`chart.getTopTracks`), o álbum de cada
 * uma (`track.getInfo`) e pontos pela posição no ranking (1º lugar vale mais). O `playcount`
 * do ranking é de todos os tempos, por isso não serve para ordenar.
 * Função pura, com teste em trending.test.ts.
 */

export type TrendingCover = { imageUrl: string; name: string; artist: string };

/** Quantas capas a colagem usa. */
export const TRENDING_COVERS = 12;

/** Coletâneas não contam (não são "o álbum" de ninguém). */
const COMPILATION_ARTISTS = new Set(["various artists", "vários artistas", "varios artistas"]);

/**
 * `tracks` vêm na ordem do ranking. Cada música dá ao seu álbum (total - posição) pontos;
 * álbuns com mais pontos primeiro (empate: o que apareceu antes). Sem álbum ou sem capa, fica de fora.
 */
export function rankTrendingAlbums(
  tracks: { album: string | null; albumArtist: string | null; imageUrl: string | null }[],
  max = TRENDING_COVERS,
): TrendingCover[] {
  const albums = new Map<string, { cover: TrendingCover; points: number; first: number }>();
  tracks.forEach((t, i) => {
    if (!t.album || !t.albumArtist || !t.imageUrl) return;
    if (COMPILATION_ARTISTS.has(t.albumArtist.toLocaleLowerCase("pt-BR"))) return;
    const key = `${t.albumArtist}\u0000${t.album}`.toLocaleLowerCase("pt-BR");
    const entry = albums.get(key) ?? {
      cover: { imageUrl: t.imageUrl, name: t.album, artist: t.albumArtist },
      points: 0,
      first: i,
    };
    entry.points += tracks.length - i;
    albums.set(key, entry);
  });
  return [...albums.values()]
    .sort((a, b) => b.points - a.points || a.first - b.first)
    .slice(0, max)
    .map((a) => a.cover);
}
