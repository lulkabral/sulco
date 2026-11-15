// Único lugar do projeto que conhece a chave do Last.fm e faz chamadas a ele.
// "server-only" faz o build falhar se este arquivo for importado por código do navegador.
import "server-only";

import { cacheLife } from "next/cache";
import { computeTopGenres, mapWithLimit, type Genre } from "@/lib/genres";
import { LastfmError, mapLastfmError } from "./errors";
import {
  getLastfmErrorNumber,
  normalizeArtistTags,
  normalizeRecentTotal,
  normalizeScrobblePage,
  normalizeTop,
  normalizeUserInfo,
} from "./normalize";
import type {
  ArtistTagsResponse,
  ErrorCode,
  Period,
  ScrobblePage,
  TopResponse,
  TopType,
  UserInfo,
} from "./types";

const API_URL = "https://ws.audioscrobbler.com/2.0/";
const USER_AGENT = "RecapMensal/0.1 (projeto não comercial)";
const TIMEOUT_MS = 8000;

/** Métodos de leitura permitidos (docs/LASTFM.md). Qualquer outro é recusado. */
const ALLOWED_METHODS = [
  "user.getInfo",
  "user.getTopArtists",
  "user.getTopAlbums",
  "user.getTopTracks",
  "user.getRecentTracks",
  "artist.getTopTags",
] as const;
type Method = (typeof ALLOWED_METHODS)[number];

/** O que a função com cache devolve: o JSON cru ou o nosso código de erro. */
type RawResult = { ok: true; body: unknown } | { ok: false; code: ErrorCode; retry?: boolean };

const RETRY_DELAY_MS = 500;
/** Erros do Last.fm que costumam ser passageiros: 8 (operation failed), 11 e 16 (fora do ar). */
const TRANSIENT_ERRORS = new Set([8, 11, 16]);

/**
 * Por quanto tempo guardar cada tipo de resposta (docs/LASTFM.md):
 * - short: dados do usuário, 10 min "fresco", expira em 30 min;
 * - day: scrobbles de intervalo encerrado: 1 dia "fresco", expira em 7;
 * - week: tags de artista, mudam pouco: 7 dias "fresco", expira em 14.
 */
const CACHE_PROFILES = {
  short: { revalidate: 600, expire: 1800 },
  day: { revalidate: 86_400, expire: 604_800 },
  week: { revalidate: 604_800, expire: 1_209_600 },
} as const;
type CacheProfile = keyof typeof CACHE_PROFILES;

/**
 * Faz a chamada e guarda o resultado em cache (por método + parâmetros).
 * Sucesso fica em cache pelo perfil escolhido. Erro fica só alguns segundos:
 * o bastante para não martelar o Last.fm, curto para o botão "Tentar de novo" funcionar.
 * Erros viram valor de retorno (e não exceção) para atravessar o cache sem perder o código.
 */
async function fetchLastfmCached(
  method: Method,
  params: Record<string, string>,
  cache: CacheProfile,
): Promise<RawResult> {
  "use cache";

  let result = await fetchLastfm(method, params);
  if (!result.ok && result.retry) {
    // Erros temporários (ex.: 8 "operation failed") costumam passar na segunda tentativa.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    result = await fetchLastfm(method, params);
  }
  if (result.ok) {
    cacheLife(CACHE_PROFILES[cache]);
  } else {
    cacheLife({ revalidate: 5, expire: 15 });
  }
  return result;
}

async function fetchLastfm(method: Method, params: Record<string, string>): Promise<RawResult> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    console.error("[lastfm] LASTFM_API_KEY não configurada");
    return { ok: false, code: "LASTFM_DOWN" };
  }

  const url = new URL(API_URL);
  url.search = new URLSearchParams({ ...params, method, api_key: apiKey, format: "json" }).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error(`[lastfm] ${method}: sem resposta (rede ou tempo esgotado)`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    console.error(`[lastfm] ${method}: resposta não é JSON (HTTP ${response.status})`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  // Conferir o campo `error` no JSON, sem confiar só no status HTTP.
  const errorNumber = getLastfmErrorNumber(body);
  if (errorNumber !== null) {
    if (errorNumber === 10 || errorNumber === 26) {
      console.error(`[lastfm] ${method}: chave inválida ou suspensa (erro ${errorNumber})`);
    } else if (errorNumber !== 6) {
      console.error(`[lastfm] ${method}: erro ${errorNumber}`);
    }
    return {
      ok: false,
      code: mapLastfmError(errorNumber),
      retry: TRANSIENT_ERRORS.has(errorNumber),
    };
  }

  if (!response.ok) {
    console.error(`[lastfm] ${method}: HTTP ${response.status}`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  return { ok: true, body };
}

/** Chama um método permitido e devolve o JSON cru; lança LastfmError em caso de erro. */
async function callLastfm(
  method: Method,
  params: Record<string, string>,
  cache: CacheProfile = "short",
): Promise<unknown> {
  if (!(ALLOWED_METHODS as readonly string[]).includes(method)) {
    throw new LastfmError("BAD_REQUEST", "Método não permitido.");
  }
  const result = await fetchLastfmCached(method, params, cache);
  if (!result.ok) throw new LastfmError(result.code);
  return result.body;
}

export async function getUserInfo(username: string): Promise<UserInfo> {
  const raw = await callLastfm("user.getInfo", { user: username });
  return normalizeUserInfo(raw);
}

const TOP_METHODS: Record<TopType, Method> = {
  artists: "user.getTopArtists",
  albums: "user.getTopAlbums",
  tracks: "user.getTopTracks",
};

export async function getTop(
  username: string,
  type: TopType,
  period: Period,
  limit: number,
): Promise<TopResponse> {
  const raw = await callLastfm(TOP_METHODS[type], {
    user: username,
    period,
    limit: String(limit),
  });
  const { total, items } = normalizeTop(type, raw);
  // O Last.fm às vezes devolve mais itens que o limit pedido; cortamos aqui.
  return { user: username, type, period, total, items: items.slice(0, limit) };
}

/**
 * Total de scrobbles entre `from` e `to` (timestamps UNIX em segundos).
 * Uma chamada só: pede 1 faixa e lê o total que vem junto.
 */
export async function getScrobbleTotal(username: string, from: number, to: number): Promise<number> {
  const raw = await callLastfm("user.getRecentTracks", {
    user: username,
    from: String(from),
    to: String(to),
    limit: "1",
  });
  return normalizeRecentTotal(raw);
}

/**
 * Tags de um artista (cache de 7 dias). Artista que o Last.fm não conhece
 * (erro 6, que viraria USER_NOT_FOUND) devolve lista vazia em vez de erro.
 */
export async function getArtistTags(artist: string): Promise<ArtistTagsResponse> {
  try {
    const raw = await callLastfm("artist.getTopTags", { artist }, "week");
    return normalizeArtistTags(raw, artist);
  } catch (err) {
    if (err instanceof LastfmError && err.code === "USER_NOT_FOUND") return { artist, tags: [] };
    throw err;
  }
}

/** Máximo de buscas de tags ao mesmo tempo (regra do projeto: 3 a 4). */
const TAGS_CONCURRENCY = 3;

/**
 * Top de gêneros dos artistas dados (SPEC, "Gêneros"). Nunca lança erro:
 * artista cujas tags falharem só fica de fora; se falharem todos, devolve null.
 */
export async function getTopGenres(
  artists: { name: string; playcount: number }[],
): Promise<Genre[] | null> {
  const tags = await mapWithLimit(artists, TAGS_CONCURRENCY, async (artist) => {
    try {
      return (await getArtistTags(artist.name)).tags;
    } catch {
      return null;
    }
  });
  if (artists.length > 0 && tags.every((t) => t === null)) return null;
  return computeTopGenres(artists.map((a, i) => ({ ...a, tags: tags[i] ?? [] })));
}

/** Scrobbles por página (máximo documentado do `user.getRecentTracks`). */
const SCROBBLES_PER_PAGE = 200;

/**
 * Intervalo já encerrado? Damos 1 dia de folga porque scrobbles atrasados
 * (de aparelho que estava offline) ainda podem chegar logo depois.
 */
export function isClosedRange(to: number, nowSeconds: number): boolean {
  return to < nowSeconds - 86_400;
}

/** Uma página de scrobbles entre `from` e `to`. Intervalo encerrado fica 1 dia em cache. */
export async function getScrobblePage(
  username: string,
  from: number,
  to: number,
  page: number,
): Promise<ScrobblePage> {
  const closed = isClosedRange(to, Date.now() / 1000);
  const raw = await callLastfm(
    "user.getRecentTracks",
    {
      user: username,
      from: String(from),
      to: String(to),
      limit: String(SCROBBLES_PER_PAGE),
      page: String(page),
    },
    closed ? "day" : "short",
  );
  return normalizeScrobblePage(raw);
}
