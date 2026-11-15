// Único lugar do projeto que conhece a chave do Last.fm e faz chamadas a ele.
// "server-only" faz o build falhar se este arquivo for importado por código do navegador.
import "server-only";

import { cacheLife } from "next/cache";
import { LastfmError, mapLastfmError } from "./errors";
import { getLastfmErrorNumber, normalizeTop, normalizeUserInfo } from "./normalize";
import type { ErrorCode, Period, TopResponse, TopType, UserInfo } from "./types";

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
 * Faz a chamada e guarda o resultado em cache (por método + parâmetros).
 * Sucesso fica 10 min "fresco" e expira em 30 min. Erro fica só alguns segundos:
 * o bastante para não martelar o Last.fm, curto para o botão "Tentar de novo" funcionar.
 * Erros viram valor de retorno (e não exceção) para atravessar o cache sem perder o código.
 */
async function fetchLastfmCached(method: Method, params: Record<string, string>): Promise<RawResult> {
  "use cache";

  let result = await fetchLastfm(method, params);
  if (!result.ok && result.retry) {
    // Erros temporários (ex.: 8 "operation failed") costumam passar na segunda tentativa.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    result = await fetchLastfm(method, params);
  }
  if (result.ok) {
    cacheLife({ revalidate: 600, expire: 1800 });
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
async function callLastfm(method: Method, params: Record<string, string>): Promise<unknown> {
  if (!(ALLOWED_METHODS as readonly string[]).includes(method)) {
    throw new LastfmError("BAD_REQUEST", "Método não permitido.");
  }
  const result = await fetchLastfmCached(method, params);
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
