import type { ApiError, ErrorCode } from "./types";

/** Erro com um dos nossos códigos. Usado no servidor para virar resposta JSON. */
export class LastfmError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "LastfmError";
  }
}

export const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  USER_NOT_FOUND: "Usuário não encontrado no Last.fm.",
  PRIVATE_PROFILE: "Este perfil deixa o histórico privado.",
  RATE_LIMITED: "Muitas consultas ao Last.fm. Tente de novo em instantes.",
  LASTFM_DOWN: "O Last.fm não respondeu. Tente de novo em instantes.",
  BAD_REQUEST: "Pedido inválido.",
};

export const HTTP_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  PRIVATE_PROFILE: 403,
  USER_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  LASTFM_DOWN: 502,
};

/**
 * Converte o número de erro do Last.fm para o nosso código.
 * Tabela em docs/LASTFM.md. Qualquer número desconhecido vira LASTFM_DOWN.
 */
export function mapLastfmError(lastfmCode: number): ErrorCode {
  switch (lastfmCode) {
    case 6:
      return "USER_NOT_FOUND";
    case 17:
      return "PRIVATE_PROFILE";
    case 29:
      return "RATE_LIMITED";
    default:
      // 10 (chave inválida), 11 e 16 (fora do ar), 26 (chave suspensa) e outros
      return "LASTFM_DOWN";
  }
}

export function errorBody(code: ErrorCode, message?: string): ApiError {
  return { error: { code, message: message ?? DEFAULT_MESSAGES[code] } };
}
