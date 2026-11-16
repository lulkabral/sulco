// Ajudantes para as rotas devolverem JSON com o cabeçalho de cache certo.

import { errorBody, HTTP_STATUS, LastfmError } from "./errors";
import type { ErrorCode } from "./types";

/** Tempo de cache na CDN, em segundos. */
export const CACHE_SECONDS = {
  /** user.getInfo e tops por período: 10 minutos (docs/LASTFM.md). */
  short: 600,
  /** Tags de artista: 7 dias (docs/LASTFM.md). */
  week: 604_800,
  /** Scrobbles de intervalo já encerrado: 1 dia. */
  day: 86_400,
  /** Capas de álbum: 30 dias. */
  month: 2_592_000,
} as const;

/**
 * Resposta JSON com cache na CDN (`s-maxage`). `browserSeconds` deixa o próprio navegador
 * guardar também (útil para dados que não mudam, como meses encerrados).
 */
export function jsonOk(data: unknown, cacheSeconds: number, browserSeconds = 0): Response {
  const browser = browserSeconds > 0 ? `max-age=${browserSeconds}, ` : "";
  return Response.json(data, {
    headers: {
      "Cache-Control": `public, ${browser}s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    },
  });
}

export function jsonError(code: ErrorCode, message?: string): Response {
  return Response.json(errorBody(code, message), {
    status: HTTP_STATUS[code],
    headers: { "Cache-Control": "no-store" },
  });
}

/** Converte qualquer erro em resposta JSON, sem vazar detalhes internos. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof LastfmError) return jsonError(err.code, err.message);
  console.error("[api] erro inesperado:", err instanceof Error ? err.name : "desconhecido");
  return jsonError("LASTFM_DOWN");
}
