/**
 * "Foto" de cada artista a partir das capas que já temos: o Last.fm não tem mais fotos
 * de artista (armadilha 7 em docs/LASTFM.md). Usa a capa do álbum mais ouvido daquele
 * artista no período (a lista de álbuns já vem do mais para o menos ouvido).
 * Sem álbum com capa, devolve null (a tela mostra a inicial do nome).
 */
export function artistImages(
  artists: { name: string }[],
  albums: { artist: string; imageUrl: string | null }[],
): (string | null)[] {
  const byArtist = new Map<string, string>();
  for (const album of albums) {
    const key = album.artist.toLocaleLowerCase("pt-BR");
    if (album.imageUrl && !byArtist.has(key)) byArtist.set(key, album.imageUrl);
  }
  return artists.map((a) => byArtist.get(a.name.toLocaleLowerCase("pt-BR")) ?? null);
}
