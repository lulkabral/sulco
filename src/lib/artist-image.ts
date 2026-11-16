/** Onde buscar uma capa que ainda não temos (rotas /api/lastfm/album e /api/lastfm/track). */
export type CoverLookup = { type: "album" | "track"; artist: string; name: string };

export type ArtistPicture = {
  /** Capa já conhecida, ou null. */
  image: string | null;
  /** Sem capa conhecida: o que buscar para ter uma. */
  lookup?: CoverLookup;
};

const key = (s: string) => s.toLocaleLowerCase("pt-BR");

/**
 * "Foto" de cada artista a partir de capas: o Last.fm não tem mais fotos de artista
 * (armadilha 7 em docs/LASTFM.md). Usa o álbum mais ouvido daquele artista no período
 * (as listas já vêm do mais para o menos ouvido):
 * - se o álbum já tem capa, usa a capa;
 * - se não tem (no ano só as primeiras capas são buscadas), diz qual álbum buscar;
 * - sem álbum do artista na lista, busca a capa da música mais ouvida dele.
 * Sem nada disso, fica null (a tela mostra a inicial).
 */
export function artistPictures(
  artists: { name: string }[],
  albums: { name: string; artist: string; imageUrl: string | null }[],
  tracks: { name: string; artist: string; imageUrl?: string | null }[] = [],
): ArtistPicture[] {
  const withCover = new Map<string, string>();
  const firstAlbum = new Map<string, { name: string; artist: string }>();
  for (const album of albums) {
    const k = key(album.artist);
    if (!firstAlbum.has(k)) firstAlbum.set(k, album);
    if (album.imageUrl && !withCover.has(k)) withCover.set(k, album.imageUrl);
  }
  const firstTrack = new Map<string, { name: string; artist: string; imageUrl?: string | null }>();
  for (const track of tracks) {
    const k = key(track.artist);
    if (!firstTrack.has(k)) firstTrack.set(k, track);
  }

  return artists.map((a) => {
    const k = key(a.name);
    const cover = withCover.get(k);
    if (cover) return { image: cover };
    const album = firstAlbum.get(k);
    if (album) return { image: null, lookup: { type: "album", artist: album.artist, name: album.name } };
    const track = firstTrack.get(k);
    if (track?.imageUrl) return { image: track.imageUrl };
    if (track) return { image: null, lookup: { type: "track", artist: track.artist, name: track.name } };
    return { image: null };
  });
}
