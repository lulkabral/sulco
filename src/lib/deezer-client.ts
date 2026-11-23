// Chamadas só leitura e com cache à busca pública da Deezer para capas ausentes e fotos de artista.
import "server-only";

import { cacheLife } from "next/cache";
import {
  pickDeezerAlbumCover,
  pickDeezerArtistPicture,
  pickDeezerTrackCover,
  stripEditionSuffix,
} from "./deezer";

const USER_AGENT = "sulco/0.1 (projeto não comercial)";
const TIMEOUT_MS = 6000;

const CACHE_HIT = { revalidate: 2_592_000, expire: 5_184_000 } as const; // 30 dias
const CACHE_MISS = { revalidate: 86_400, expire: 604_800 } as const; // 1 dia
const CACHE_ERROR = { revalidate: 60, expire: 180 } as const; // erro passageiro / cota

type SearchResult = { ok: true; body: unknown } | { ok: false };

async function searchDeezer(endpoint: "album" | "artist" | "track", query: string, limit: number): Promise<SearchResult> {
  const url = new URL(`https://api.deezer.com/search/${endpoint}`);
  url.search = new URLSearchParams({ q: query, limit: String(limit) }).toString();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false };
    const body: unknown = await res.json();
    if (!body || typeof body !== "object" || "error" in body) return { ok: false };
    return { ok: true, body };
  } catch {
    return { ok: false };
  }
}

/** Capa de álbum via Deezer (com segunda tentativa sem sufixo de edição como Deluxe/Remaster). */
export async function getDeezerAlbumCover(artist: string, album: string): Promise<string | null> {
  "use cache";
  const first = await searchDeezer("album", `${artist} ${album}`, 8);
  if (!first.ok) {
    cacheLife(CACHE_ERROR);
    return null;
  }

  let cover = pickDeezerAlbumCover(first.body, artist, album);
  if (!cover) {
    const clean = stripEditionSuffix(album);
    if (clean.toLowerCase() !== album.trim().toLowerCase()) {
      const retry = await searchDeezer("album", `${artist} ${clean}`, 8);
      if (!retry.ok) {
        cacheLife(CACHE_ERROR);
        return null;
      }
      cover = pickDeezerAlbumCover(retry.body, artist, album);
    }
  }

  cacheLife(cover ? CACHE_HIT : CACHE_MISS);
  return cover;
}

/** Foto oficial do artista via Deezer (`limit=15` para incluir o perfil principal entre homônimos). */
export async function getDeezerArtistPicture(artist: string): Promise<string | null> {
  "use cache";
  const result = await searchDeezer("artist", artist, 15);
  if (!result.ok) {
    cacheLife(CACHE_ERROR);
    return null;
  }

  const picture = pickDeezerArtistPicture(result.body, artist);
  cacheLife(picture ? CACHE_HIT : CACHE_MISS);
  return picture;
}

/** Capa do álbum de uma faixa via Deezer (usado apenas quando o Last.fm não tem capa para a faixa). */
export async function getDeezerTrackCover(artist: string, track: string): Promise<string | null> {
  "use cache";
  const first = await searchDeezer("track", `${artist} ${track}`, 8);
  if (!first.ok) {
    cacheLife(CACHE_ERROR);
    return null;
  }

  let cover = pickDeezerTrackCover(first.body, artist, track);
  if (!cover) {
    const clean = stripEditionSuffix(track);
    if (clean.toLowerCase() !== track.trim().toLowerCase()) {
      const retry = await searchDeezer("track", `${artist} ${clean}`, 8);
      if (!retry.ok) {
        cacheLife(CACHE_ERROR);
        return null;
      }
      cover = pickDeezerTrackCover(retry.body, artist, track);
    }
  }

  cacheLife(cover ? CACHE_HIT : CACHE_MISS);
  return cover;
}
