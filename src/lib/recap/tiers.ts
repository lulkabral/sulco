import { truncateText, type Measure } from "@/lib/canvas/text";

// Divisão dos artistas em "andares" do pôster Lineup, como num cartaz de festival:
// a atração principal sozinha e bem grande, depois grupos cada vez maiores e menores.

/** Até onde vai cada andar (posição final, exclusiva): 1 | 2-3 | 4-7 | 8-15. */
export const TIER_ENDS = [1, 3, 7, 15] as const;

/** Tamanho de fonte de cada andar, em px. */
export const TIER_SIZES = [150, 76, 50, 34] as const;

export type Tier = { level: number; names: string[] };

/** Agrupa os nomes (já em ordem de ranking) nos andares. Andares vazios ficam de fora. */
export function lineupTiers(names: readonly string[]): Tier[] {
  const tiers: Tier[] = [];
  let start = 0;
  TIER_ENDS.forEach((end, level) => {
    const slice = names.slice(start, end);
    if (slice.length > 0) tiers.push({ level, names: slice });
    start = end;
  });
  return tiers;
}

export const NAME_SEPARATOR = "  ·  ";

/**
 * Distribui os nomes em linhas que cabem em `maxWidth`, quebrando sempre ENTRE nomes
 * (nunca no meio de "Troye Sivan"). Nome que sozinho não cabe é cortado com reticências.
 * Se sobrar nome depois de `maxLines`, ele fica de fora.
 */
export function packNames(names: readonly string[], maxWidth: number, maxLines: number, measure: Measure): string[] {
  const lines: string[] = [];
  let current = "";
  for (const raw of names) {
    const name = measure(raw) > maxWidth ? truncateText(raw, maxWidth, measure) : raw;
    const candidate = current ? `${current}${NAME_SEPARATOR}${name}` : name;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length === maxLines) return lines;
    current = name;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}
