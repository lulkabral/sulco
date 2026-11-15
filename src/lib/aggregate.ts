// Soma de scrobbles por artista, álbum e música (fase 6, mês fechado).
// Roda no navegador: o servidor só entrega as páginas, não guarda nem soma nada.

import type { Scrobble, TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";

export type MonthTops = {
  /** Scrobbles somados (já sem a faixa "tocando agora"). */
  total: number;
  artists: TopArtist[];
  albums: TopAlbum[];
  tracks: TopTrack[];
};

/**
 * Endereço de uma página do Last.fm (artista, álbum ou música).
 * O Last.fm usa "+" no lugar de espaço; o resto é codificado normalmente.
 */
export function lastfmMusicUrl(...parts: string[]): string {
  const path = parts.map((p) => encodeURIComponent(p).replace(/%20/g, "+")).join("/");
  return `https://www.last.fm/music/${path}`;
}

/** Chave de comparação: ignora maiúsculas e espaços nas pontas. */
function keyOf(...parts: string[]): string {
  return parts.map((p) => p.trim().toLowerCase()).join("\u0000");
}

type Counter<T> = Map<string, T & { playcount: number; firstIndex: number }>;

function bump<T extends object>(map: Counter<T>, key: string, index: number, make: () => T) {
  const entry = map.get(key);
  if (entry) entry.playcount++;
  else map.set(key, { ...make(), playcount: 1, firstIndex: index });
}

/**
 * Ordena do mais tocado para o menos. No empate, vem primeiro o que apareceu antes
 * na lista de scrobbles (que vem do mais recente para o mais antigo). Numera a partir de 1.
 */
function ranked<T extends { playcount: number; firstIndex: number }>(map: Map<string, T>) {
  return [...map.values()]
    .sort((a, b) => b.playcount - a.playcount || a.firstIndex - b.firstIndex)
    .map((entry, i) => {
      const item: Omit<T, "firstIndex"> & { firstIndex?: number } = { ...entry };
      delete item.firstIndex; // só servia para o desempate
      return { ...item, rank: i + 1 };
    });
}

/**
 * Soma os scrobbles em tops de artistas, álbuns e músicas.
 * - Scrobble sem data (`playedAt` <= 0, ex.: "tocando agora") é ignorado.
 * - Scrobble sem nome de álbum conta para artista e música, mas não vira álbum.
 * - A capa do álbum é a primeira encontrada entre os scrobbles dele.
 * - Álbum é identificado por artista da faixa + nome do álbum (a API não dá o artista do álbum).
 */
export function aggregateScrobbles(scrobbles: readonly Scrobble[]): MonthTops {
  const artists: Counter<Omit<TopArtist, "rank" | "playcount">> = new Map();
  const albums: Counter<Omit<TopAlbum, "rank" | "playcount">> = new Map();
  const tracks: Counter<Omit<TopTrack, "rank" | "playcount">> = new Map();
  let total = 0;

  scrobbles.forEach((s, i) => {
    if (s.playedAt <= 0 || s.artist === "" || s.name === "") return;
    total++;

    bump(artists, keyOf(s.artist), i, () => ({ name: s.artist, url: lastfmMusicUrl(s.artist) }));

    bump(tracks, keyOf(s.artist, s.name), i, () => ({
      name: s.name,
      artist: s.artist,
      url: s.url || lastfmMusicUrl(s.artist, "_", s.name),
    }));

    if (s.album !== "") {
      const key = keyOf(s.artist, s.album);
      bump(albums, key, i, () => ({
        name: s.album,
        artist: s.artist,
        url: lastfmMusicUrl(s.artist, s.album),
        imageUrl: s.imageUrl,
      }));
      const album = albums.get(key)!;
      if (!album.imageUrl && s.imageUrl) album.imageUrl = s.imageUrl;
    }
  });

  return { total, artists: ranked(artists), albums: ranked(albums), tracks: ranked(tracks) };
}
