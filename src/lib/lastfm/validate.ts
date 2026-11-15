import { PERIODS, TOP_TYPES, type Period, type TopType } from "./types";

// Regra de cadastro do Last.fm: 2 a 15 caracteres, começa com letra,
// depois letras, números, "_" ou "-".
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_-]{1,14}$/;

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
