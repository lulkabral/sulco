/** Mede a largura de um texto em pixels (no canvas: `s => ctx.measureText(s).width`). */
export type Measure = (text: string) => number;

const ELLIPSIS = "…";

/**
 * Corta o texto com reticências para caber em `maxWidth`.
 * Trabalha com caracteres inteiros (Array.from), então não quebra emoji ao meio.
 */
export function truncateText(text: string, maxWidth: number, measure: Measure): string {
  const clean = text.trim();
  if (measure(clean) <= maxWidth) return clean;

  const chars = Array.from(clean);
  // Busca binária: maior quantidade de caracteres que ainda cabe com "…".
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join("").trimEnd() + ELLIPSIS;
    if (measure(candidate) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? ELLIPSIS : chars.slice(0, lo).join("").trimEnd() + ELLIPSIS;
}

/**
 * Quebra o texto em até `maxLines` linhas que cabem em `maxWidth`.
 * A última linha leva reticências se ainda sobrar texto.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: Measure,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let i = 0;

  while (i < words.length && lines.length < maxLines) {
    const isLastLine = lines.length === maxLines - 1;
    let line = words[i];
    i++;
    while (i < words.length && measure(`${line} ${words[i]}`) <= maxWidth) {
      line = `${line} ${words[i]}`;
      i++;
    }
    if (isLastLine && i < words.length) {
      // Sobrou texto: junta o resto e corta com reticências.
      line = truncateText(`${line} ${words.slice(i).join(" ")}`, maxWidth, measure);
      i = words.length;
    } else {
      line = truncateText(line, maxWidth, measure);
    }
    lines.push(line);
  }
  return lines;
}
