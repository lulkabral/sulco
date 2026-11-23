/**
 * Onde buscar uma capa que ainda não temos (rotas /api/lastfm/album, /track e /artist).
 * `fallback`: o que tentar se esta busca não achar capa.
 */
export type CoverLookup = {
  type: "album" | "track" | "artist";
  artist: string;
  name: string;
  /** Imagem já conhecida (ex.: capa do álbum mais ouvido) para usar direto se a busca falhar. */
  fallbackUrl?: string;
  fallback?: CoverLookup;
};

export type ArtistPicture = {
  /** Capa já conhecida, ou null. */
  image: string | null;
  /** Sem foto já resolvida: o que buscar para ter uma. */
  lookup?: CoverLookup;
};

const key = (s: string) => s.toLocaleLowerCase("pt-BR");

/**
 * Foto de cada artista para "O que mais tocou" e as bolinhas de gêneros:
 * tenta primeiro a foto oficial do artista (via /api/lastfm/artist -> Deezer, ou álbum
 * mais popular no Last.fm). Só se não houver foto, cai para a capa já conhecida ou
 * para a busca do álbum/música mais ouvidos do artista no período.
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
    const album = firstAlbum.get(k);
    const track = firstTrack.get(k);

    const lookup: CoverLookup = { type: "artist", artist: a.name, name: a.name };
    if (cover) {
      lookup.fallbackUrl = cover;
    } else if (album) {
      lookup.fallback = { type: "album", artist: album.artist, name: album.name };
    } else if (track?.imageUrl) {
      lookup.fallbackUrl = track.imageUrl;
    } else if (track) {
      lookup.fallback = { type: "track", artist: track.artist, name: track.name };
    }
    return { image: null, lookup };
  });
}
