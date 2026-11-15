const numberFormat = new Intl.NumberFormat("pt-BR");

/** 69921 -> "69.921" */
export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

/** 1 -> "1 reprodução", 25 -> "25 reproduções" */
export function formatPlays(n: number): string {
  return `${formatNumber(n)} ${n === 1 ? "reprodução" : "reproduções"}`;
}

/** Ano (em UTC) de um timestamp UNIX em segundos. 0 ou inválido -> null. */
export function yearOf(unixSeconds: number): number | null {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return null;
  return new Date(unixSeconds * 1000).getUTCFullYear();
}
