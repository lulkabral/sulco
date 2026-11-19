// Pedidos de capa e de duração feitos pelo navegador depois que a página aparece
// (rotas /api/lastfm/album e /api/lastfm/track). Uma fila só para a página toda:
// no máximo 3 ao mesmo tempo (regra do projeto), e cada item pedido uma vez por visita.

import type { CoverLookup } from "./artist-image";

export type TrackInfo = { imageUrl: string | null; durationSec: number | null };

type Priority = "high" | "low";

const EMPTY: TrackInfo = { imageUrl: null, durationSec: null };
const MAX_PARALLEL = 3;
let running = 0;
const highQueue: (() => void)[] = [];
const lowQueue: (() => void)[] = [];
const cache = new Map<string, Promise<unknown>>();

async function limited<T>(fn: () => Promise<T>, priority: Priority): Promise<T> {
  if (running >= MAX_PARALLEL) {
    await new Promise<void>((resolve) => (priority === "high" ? highQueue : lowQueue).push(resolve));
  }
  running++;
  try {
    return await fn();
  } finally {
    running--;
    (highQueue.shift() ?? lowQueue.shift())?.();
  }
}

function once<T>(key: string, fn: () => Promise<T>, priority: Priority = "low"): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = limited(fn, priority);
    cache.set(key, p);
  }
  return p;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Capa e duração de uma música. Falha vira tudo null. */
export function trackInfo(artist: string, name: string, priority: Priority = "low"): Promise<TrackInfo> {
  return once(
    `track\u0000${artist}\u0000${name}`,
    async () => {
      const data = await getJson<Partial<TrackInfo>>(`/api/lastfm/track?${new URLSearchParams({ artist, track: name })}`);
      return data ? { imageUrl: data.imageUrl ?? null, durationSec: data.durationSec ?? null } : EMPTY;
    },
    priority,
  );
}

/** Capa de um álbum, de uma música ou do álbum mais popular de um artista; sem capa, tenta o `fallback`. */
export async function findCover(lookup: CoverLookup, priority: Priority = "low"): Promise<string | null> {
  const url = await findOne(lookup, priority);
  return url ?? (lookup.fallback ? findCover(lookup.fallback, priority) : null);
}

function findOne(lookup: CoverLookup, priority: Priority): Promise<string | null> {
  if (lookup.type === "track") return trackInfo(lookup.artist, lookup.name, priority).then((t) => t.imageUrl);
  if (lookup.type === "artist") {
    return once(
      `artist\u0000${lookup.artist}`,
      async () => {
        const data = await getJson<{ imageUrl?: string | null }>(
          `/api/lastfm/artist?${new URLSearchParams({ name: lookup.artist })}`,
        );
        return data?.imageUrl ?? null;
      },
      priority,
    );
  }
  return once(
    `album\u0000${lookup.artist}\u0000${lookup.name}`,
    async () => {
      const data = await getJson<{ imageUrl?: string | null }>(
        `/api/lastfm/album?${new URLSearchParams({ artist: lookup.artist, album: lookup.name })}`,
      );
      return data?.imageUrl ?? null;
    },
    priority,
  );
}

/**
 * Endereço da capa de um álbum da lista do usuário. Às vezes o Last.fm manda o álbum sem
 * imagem na lista (user.getTopAlbums), mas a página do álbum tem: aí pergunta a ela.
 * Entra com prioridade alta na fila para o recap e a grade não esperarem miniaturas das listas.
 */
export function albumCover(album: { name: string; artist: string; imageUrl?: string | null }): Promise<string | null> {
  if (album.imageUrl) return Promise.resolve(album.imageUrl);
  if (!album.artist) return Promise.resolve(null);
  return findCover({ type: "album", artist: album.artist, name: album.name }, "high");
}
