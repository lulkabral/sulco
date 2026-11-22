import { PERIODS, TOP_TYPES, type Period, type TopType } from "./types";

// Usernames do Last.fm: 2 a 15 caracteres, letras, números, "_" ou "-".
// Hoje o cadastro exige começar com letra, mas contas antigas (2005-2006) começam com
// número ou "_" (ex.: "1990", "_x"; testado em 16/11/2026). Por isso aceitamos qualquer ordem.
const USERNAME_RE = /^[A-Za-z0-9_-]{2,15}$/;

export const DEFAULT_PERIOD: Period = "7day";
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

/** Resultado de uma validação: ou o valor pronto, ou a mensagem de erro. */
export type Validated<T> = { ok: true; value: T } | { ok: false; message: string };

export function validateUsername(raw: string | null): Validated<string> {
  const value = (raw ?? "").trim();
  if (!USERNAME_RE.test(value)) {
    return { ok: false, message: "Username inválido." };
  }
  return { ok: true, value };
}

export function validateTopType(raw: string | null): Validated<TopType> {
  if (raw !== null && (TOP_TYPES as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as TopType };
  }
  return { ok: false, message: `type deve ser um de: ${TOP_TYPES.join(", ")}.` };
}

/**
 * Importante: o Last.fm não reclama de período inválido, ele devolve
 * "overall" sem avisar. Por isso a validação aqui é obrigatória.
 */
export function validatePeriod(raw: string | null): Validated<Period> {
  if (raw === null || raw === "") return { ok: true, value: DEFAULT_PERIOD };
  if ((PERIODS as readonly string[]).includes(raw)) {
    return { ok: true, value: raw as Period };
  }
  return { ok: false, message: `period deve ser um de: ${PERIODS.join(", ")}.` };
}

export const DEFAULT_CHART_LIMIT = 50;
export const MAX_CHART_LIMIT = 200;

export function validateLimit(raw: string | null): Validated<number> {
  if (raw === null || raw === "") return { ok: true, value: DEFAULT_LIMIT };
  if (!/^\d+$/.test(raw)) {
    return { ok: false, message: `limit deve ser um número de 1 a ${MAX_LIMIT}.` };
  }
  const value = Number(raw);
  if (value < 1 || value > MAX_LIMIT) {
    return { ok: false, message: `limit deve ser um número de 1 a ${MAX_LIMIT}.` };
  }
  return { ok: true, value };
}

/** Limite de itens devolvidos pela rota de gráfico (padrão 50, máximo 200). */
export function validateChartLimit(raw: string | null): Validated<number> {
  if (raw === null || raw === "") return { ok: true, value: DEFAULT_CHART_LIMIT };
  if (!/^\d+$/.test(raw)) {
    return { ok: false, message: `limit deve ser um número de 1 a ${MAX_CHART_LIMIT}.` };
  }
  const value = Number(raw);
  if (value < 1 || value > MAX_CHART_LIMIT) {
    return { ok: false, message: `limit deve ser um número de 1 a ${MAX_CHART_LIMIT}.` };
  }
  return { ok: true, value };
}

/** Nome de artista: 1 a 200 caracteres, sem caracteres de controle. */
export function validateArtistName(raw: string | null): Validated<string> {
  const value = (raw ?? "").trim();
  if (value.length === 0 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, message: "Nome de artista inválido." };
  }
  return { ok: true, value };
}

/** Máximo de páginas de scrobbles por consulta (50 x 200 = 10 mil scrobbles). */
export const MAX_SCROBBLE_PAGES = 50;
/** Maior intervalo aceito pela rota de scrobbles: um mês, com folga para fuso. */
export const MAX_RANGE_SECONDS = 32 * 86_400;
/** Maior intervalo aceito pela rota de gráficos: um ano, com folga para fuso e ano bissexto. */
export const MAX_YEAR_RANGE_SECONDS = 367 * 86_400;
/** 1/1/2002, antes do Last.fm existir. */
const MIN_TIMESTAMP = 1_009_843_200;

function parseInteger(raw: string | null): number | null {
  return raw !== null && /^\d{1,12}$/.test(raw) ? Number(raw) : null;
}

/** `from` e `to` (timestamps UNIX em segundos) de um intervalo de até `maxSeconds` (padrão: 32 dias). */
export function validateRange(
  rawFrom: string | null,
  rawTo: string | null,
  maxSeconds = MAX_RANGE_SECONDS,
): Validated<{ from: number; to: number }> {
  const from = parseInteger(rawFrom);
  const to = parseInteger(rawTo);
  if (from === null || to === null || from < MIN_TIMESTAMP || to <= from) {
    return { ok: false, message: "from e to devem ser timestamps, com from < to." };
  }
  if (to - from > maxSeconds) {
    return { ok: false, message: `O intervalo pode ter no máximo ${Math.round(maxSeconds / 86_400)} dias.` };
  }
  return { ok: true, value: { from, to } };
}

export function validatePage(raw: string | null): Validated<number> {
  if (raw === null || raw === "") return { ok: true, value: 1 };
  const page = parseInteger(raw);
  if (page === null || page < 1 || page > MAX_SCROBBLE_PAGES) {
    return { ok: false, message: `page deve ser um número de 1 a ${MAX_SCROBBLE_PAGES}.` };
  }
  return { ok: true, value: page };
}

/** Nome de álbum: mesmas regras do nome de artista. */
export function validateTrackName(raw: string | null): Validated<string> {
  const result = validateArtistName(raw);
  return result.ok ? result : { ok: false, message: "Nome de música inválido." };
}

export function validateAlbumName(raw: string | null): Validated<string> {
  const result = validateArtistName(raw);
  return result.ok ? result : { ok: false, message: "Nome de álbum inválido." };
}
