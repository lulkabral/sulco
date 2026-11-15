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

/** "nov." -> "nov" (o Intl põe ponto na abreviação do mês). */
function monthShort(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone }).format(date).replace(".", "");
}

function dateParts(unixSeconds: number, timeZone?: string) {
  const date = new Date(unixSeconds * 1000);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: String(Number(get("day"))), month: get("month"), year: get("year"), monthName: monthShort(date, timeZone) };
}

/**
 * Intervalo de datas curto, no fuso do aparelho (ou no `timeZone` dado).
 * Exemplos: "8 – 15 nov 2026", "16 out – 15 nov 2026", "15 nov 2025 – 15 nov 2026".
 */
export function formatDateRange(fromSeconds: number, toSeconds: number, timeZone?: string): string {
  const a = dateParts(fromSeconds, timeZone);
  const b = dateParts(toSeconds, timeZone);
  const end = `${b.day} ${b.monthName} ${b.year}`;
  if (a.year !== b.year) return `${a.day} ${a.monthName} ${a.year} – ${end}`;
  if (a.month !== b.month) return `${a.day} ${a.monthName} – ${end}`;
  return `${a.day} – ${end}`;
}
