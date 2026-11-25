// Funções puras para os insights editoriais dos cards da aba Tops.

export type TrackAlbumInput = {
  artist: string;
  name: string;
  album?: string | null;
};

export type DominantTrackAlbum = {
  album: string;
  count: number;
  total: number;
  /** Chave da primeira faixa desse álbum para reaproveitar a capa já carregada. */
  firstTrackKey: string;
};

/**
 * Detecta quando várias faixas do top vêm do mesmo álbum (mínimo 2).
 * Devolve o álbum mais repetido para o callout "N das 5 faixas são de [álbum]".
 */
export function findDominantTrackAlbum(tracks: readonly TrackAlbumInput[]): DominantTrackAlbum | null {
  if (tracks.length < 2) return null;
  const groups = new Map<string, { album: string; count: number; firstTrackKey: string }>();

  for (const tr of tracks) {
    const raw = tr.album?.trim();
    if (!raw) continue;
    const key = raw.toLocaleLowerCase("pt-BR");
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, {
        album: raw,
        count: 1,
        firstTrackKey: `track:${tr.artist}\u0000${tr.name}`,
      });
    }
  }

  let best: { album: string; count: number; firstTrackKey: string } | null = null;
  for (const entry of groups.values()) {
    if (entry.count >= 2 && (!best || entry.count > best.count)) {
      best = entry;
    }
  }

  return best ? { ...best, total: tracks.length } : null;
}

/**
 * Calcula que porcentagem das reproduções de um artista veio do disco nº 01.
 * Retorna null se não houver dados suficientes.
 */
export function albumSharePercent(albumPlays: number, artistPlays: number): number | null {
  if (albumPlays <= 0 || artistPlays <= 0) return null;
  const pct = Math.min(100, Math.round((albumPlays / artistPlays) * 100));
  return pct >= 1 ? pct : null;
}
