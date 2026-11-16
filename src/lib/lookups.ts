// Pedidos de capa e de duração feitos pelo navegador depois que a página aparece
// (rotas /api/lastfm/album e /api/lastfm/track). Uma fila só para a página toda:
// no máximo 3 ao mesmo tempo (regra do projeto), e cada item pedido uma vez por visita.

import type { CoverLookup } from "./artist-image";

export type TrackInfo = { imageUrl: string | null; durationSec: number | null };

const EMPTY: TrackInfo = { imageUrl: null, durationSec: null };
const MAX_PARALLEL = 3;
let running = 0;
const waiting: (() => void)[] = [];
const cache = new Map<string, Promise<unknown>>();

async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = limited(fn);
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
export function trackInfo(artist: string, name: string): Promise<TrackInfo> {
  return once(`track\u0000${artist}\u0000${name}`, async () => {
    const data = await getJson<Partial<TrackInfo>>(`/api/lastfm/track?${new URLSearchParams({ artist, track: name })}`);
    return data ? { imageUrl: data.imageUrl ?? null, durationSec: data.durationSec ?? null } : EMPTY;
  });
}

/** Capa de um álbum ou de uma música. */
export function findCover(lookup: CoverLookup): Promise<string | null> {
  if (lookup.type === "track") return trackInfo(lookup.artist, lookup.name).then((t) => t.imageUrl);
  return once(`album\u0000${lookup.artist}\u0000${lookup.name}`, async () => {
    const data = await getJson<{ imageUrl?: string | null }>(
      `/api/lastfm/album?${new URLSearchParams({ artist: lookup.artist, album: lookup.name })}`,
    );
    return data?.imageUrl ?? null;
  });
}
