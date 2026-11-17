// Busca de dados do mês fechado, no navegador, sempre pelas NOSSAS rotas /api/lastfm/*
// (o navegador nunca chama o Last.fm direto).

import type { MonthTops } from "@/lib/aggregate";
import { computeCheckedGenres, GENRE_ARTISTS, mapWithLimit, type Genre } from "@/lib/genres";
import {
  ERROR_CODES,
  type ArtistTagsResponse,
  type ChartResponse,
  type ErrorCode,
  type Scrobble,
  type ScrobblePage,
  type TopAlbum,
  type TopArtist,
  type TopTrack,
} from "@/lib/lastfm/types";
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

/** Progresso de várias chamadas: "página 3 de 12" ou "capa 3 de 9". */
export type MonthProgress = { pagesDone: number; totalPages: number; unit?: "página" | "capa" };

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
  onProgress({ pagesDone, totalPages: Math.max(totalPages, 1), unit: "página" });

  const rest = Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => i + 2);
  const pages = await mapWithLimit(rest, CONCURRENCY, async (page) => {
    const data = await getJson<ScrobblePage>(pageUrl(page), signal);
    pagesDone++;
    onProgress({ pagesDone, totalPages, unit: "página" });
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
  // Confere só as tags que chegam ao top (some "martin"); falha na conferência mantém a tag.
  const isGenre = async (tag: string) => {
    try {
      const url = `/api/lastfm/tag?${new URLSearchParams({ name: tag })}`;
      return (await getJson<{ genre: boolean }>(url, signal)).genre !== false;
    } catch {
      return true;
    }
  };
  return computeCheckedGenres(
    top.map((a, i) => ({ ...a, tags: tags[i] ?? [] })),
    isGenre,
  );
}

/**
 * Ano inteiro (ou "até agora"): 3 chamadas de gráfico (artistas, álbuns, músicas) e depois
 * as capas só dos `coverCount` primeiros álbuns (o gráfico não traz imagem), 3 por vez.
 * O total de scrobbles é a soma dos plays dos artistas (testado: bate com o Last.fm).
 */
export async function loadYearTops(
  username: string,
  range: { from: number; to: number },
  coverCount: number,
  onProgress: (p: MonthProgress) => void,
  signal: AbortSignal,
): Promise<MonthTops> {
  const chartUrl = (type: string) =>
    `/api/lastfm/chart?${new URLSearchParams({ user: username, type, from: String(range.from), to: String(range.to) })}`;

  const [artists, albums, tracks] = await Promise.all(
    ["artists", "albums", "tracks"].map((t) => getJson<ChartResponse>(chartUrl(t), signal)),
  );
  const albumItems = albums.items as TopAlbum[];

  const wanted = albumItems.slice(0, coverCount);
  let done = 0;
  onProgress({ pagesDone: 0, totalPages: wanted.length, unit: "capa" });
  const covers = await mapWithLimit(wanted, CONCURRENCY, async (a) => {
    const url = `/api/lastfm/album?${new URLSearchParams({ artist: a.artist, album: a.name })}`;
    // Uma capa que falhar não derruba o ano: o álbum só fica sem capa.
    const imageUrl = await getJson<{ imageUrl: string | null }>(url, signal)
      .then((r) => r.imageUrl)
      .catch((err) => {
        if (signal.aborted) throw err;
        return null;
      });
    done++;
    onProgress({ pagesDone: done, totalPages: wanted.length, unit: "capa" });
    return imageUrl;
  });

  const artistItems = artists.items as TopArtist[];
  return {
    // Soma de TODOS os artistas, feita no servidor antes de cortar a lista.
    total: artists.totalPlays,
    artists: artistItems,
    albums: albumItems.map((a, i) => ({ ...a, imageUrl: covers[i] ?? null })),
    tracks: tracks.items as TopTrack[],
  };
}
