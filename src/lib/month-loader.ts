// Busca de dados do mês fechado, no navegador, sempre pelas NOSSAS rotas /api/lastfm/*
// (o navegador nunca chama o Last.fm direto).

import { computeTopGenres, GENRE_ARTISTS, mapWithLimit, type Genre } from "@/lib/genres";
import { ERROR_CODES, type ArtistTagsResponse, type ErrorCode, type Scrobble, type ScrobblePage } from "@/lib/lastfm/types";
import { MAX_SCROBBLE_PAGES } from "@/lib/lastfm/validate";

/** Máximo de pedidos ao mesmo tempo (regra do projeto: 3 a 4). */
const CONCURRENCY = 3;

/** Erro de uma das nossas rotas, com o nosso código. */
export class ApiCallError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = "ApiCallError";
  }
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new ApiCallError("LASTFM_DOWN");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || body === null) {
    const code = body?.error?.code;
    throw new ApiCallError((ERROR_CODES as readonly string[]).includes(code) ? code : "LASTFM_DOWN");
  }
  return body as T;
}

export type MonthProgress = { pagesDone: number; totalPages: number };

export type MonthScrobbles = {
  scrobbles: Scrobble[];
  /** Total que o Last.fm diz ter no mês. */
  reportedTotal: number;
  /** true se o mês tinha mais páginas que o limite e parte ficou de fora. */
  truncated: boolean;
};

/**
 * Busca todas as páginas de scrobbles do intervalo: a 1ª sozinha (para saber quantas são),
 * depois o resto, 3 por vez, até o limite de 50 páginas.
 */
export async function loadMonthScrobbles(
  username: string,
  range: { from: number; to: number },
  onProgress: (p: MonthProgress) => void,
  signal: AbortSignal,
): Promise<MonthScrobbles> {
  const pageUrl = (page: number) =>
    `/api/lastfm/scrobbles?${new URLSearchParams({
      user: username,
      from: String(range.from),
      to: String(range.to),
      page: String(page),
    })}`;

  const first = await getJson<ScrobblePage>(pageUrl(1), signal);
  const totalPages = Math.min(first.totalPages, MAX_SCROBBLE_PAGES);
  let pagesDone = 1;
  onProgress({ pagesDone, totalPages: Math.max(totalPages, 1) });

  const rest = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => i + 2);
  const pages = await mapWithLimit(rest, CONCURRENCY, async (page) => {
    const data = await getJson<ScrobblePage>(pageUrl(page), signal);
    pagesDone++;
    onProgress({ pagesDone, totalPages });
    return data.tracks;
  });

  return {
    scrobbles: [...first.tracks, ...pages.flat()],
    reportedTotal: first.total,
    truncated: first.totalPages > MAX_SCROBBLE_PAGES,
  };
}

/**
 * Top de gêneros dos artistas (os 20 primeiros), com tags pela nossa rota, 3 por vez.
 * Artista cujas tags falharem fica de fora; se falharem todos, devolve null.
 */
export async function loadGenres(
  artists: { name: string; playcount: number }[],
  signal: AbortSignal,
): Promise<Genre[] | null> {
  const top = artists.slice(0, GENRE_ARTISTS);
  const tags = await mapWithLimit(top, CONCURRENCY, async (artist) => {
    try {
      const url = `/api/lastfm/tags?${new URLSearchParams({ artist: artist.name })}`;
      return (await getJson<ArtistTagsResponse>(url, signal)).tags;
    } catch {
      return null;
    }
  });
  if (top.length > 0 && tags.every((t) => t === null)) return null;
  return computeTopGenres(top.map((a, i) => ({ ...a, tags: tags[i] ?? [] })));
}
