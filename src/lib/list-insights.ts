// Cálculos puros para o bloco "Raio-X do período" abaixo de Gêneros.
// Usa só os dados já carregados pelas listas (nenhuma chamada extra à API).

import type { RankChange } from "@/lib/rank-change";

export type InsightCategory = "artists" | "tracks" | "albums";

export type BiggestClimb = {
  category: InsightCategory;
  name: string;
  detail?: string;
  rank: number;
  prevRank: number;
  delta: number;
};

export type NewEntriesStat = {
  /** Quantos itens do Top 10 (artistas + músicas + álbuns) apareceram pela 1ª vez. */
  count: number;
  /** Quantos itens do Top 10 tinham base real de comparação. */
  total: number;
};

export type TopArtistShare = {
  name: string;
  playcount: number;
  /** Porcentagem inteira entre 1 e 100. */
  percent: number;
  /** "period" = sobre todos os scrobbles do período; "top" = sobre a soma do top carregado. */
  basis: "period" | "top";
};

export type TopTrackRepeat = {
  name: string;
  artist: string;
  playcount: number;
  /** Quantas vezes mais tocou que a #2 (só preenchido quando >= 1.5x). */
  leadRatio: number | null;
};

export type PeriodInsights = {
  biggestClimb: BiggestClimb | null;
  newEntries: NewEntriesStat | null;
  topArtistShare: TopArtistShare | null;
  topTrackRepeat: TopTrackRepeat | null;
};

export type InsightsInput = {
  artists: readonly { rank: number; name: string; playcount: number }[];
  tracks: readonly { rank: number; name: string; artist: string; playcount: number }[];
  albums: readonly { rank: number; name: string; artist: string; playcount: number }[];
  /** Total de scrobbles do período, quando já disponível na página. */
  totalScrobbles?: number | null;
  changes?: {
    artists?: readonly (RankChange | null)[] | null;
    tracks?: readonly (RankChange | null)[] | null;
    albums?: readonly (RankChange | null)[] | null;
  };
};

/** Limite padrão considerado nas estatísticas de movimentação do Top 10. */
const TOP_WINDOW = 10;

/** Ordem de desempate entre categorias quando delta e posição são idênticos. */
const CATEGORY_PRIORITY: Record<InsightCategory, number> = {
  artists: 0,
  albums: 1,
  tracks: 2,
};

function clampPercent(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  return Math.min(100, Math.max(1, Math.round((numerator / denominator) * 100)));
}

/**
 * Extrai até 4 fichas curtas sobre o período atual a partir das listas já carregadas:
 * - Maior subida (entre os Top 10 de artistas, álbuns e músicas)
 * - Estreias no Top 10
 * - Peso do artista #1 (no período ou no top carregado)
 * - Música #1 no repeat (com vantagem sobre a #2 quando relevante)
 */
export function computePeriodInsights(input: InsightsInput): PeriodInsights {
  const biggestClimb = findBiggestClimb(input);
  const newEntries = countNewEntries(input);
  const topArtistShare = computeTopArtistShare(input.artists, input.totalScrobbles);
  const topTrackRepeat = computeTopTrackRepeat(input.tracks);

  return {
    biggestClimb,
    newEntries,
    topArtistShare,
    topTrackRepeat,
  };
}

export function hasPeriodInsights(insights: PeriodInsights): boolean {
  return Boolean(
    insights.biggestClimb ||
      insights.newEntries ||
      insights.topArtistShare ||
      insights.topTrackRepeat,
  );
}

function findBiggestClimb(input: InsightsInput): BiggestClimb | null {
  const changes = input.changes;
  if (!changes) return null;

  let best: BiggestClimb | null = null;

  const inspect = (
    category: InsightCategory,
    items: readonly { rank: number; name: string; detail?: string }[],
    listChanges: readonly (RankChange | null)[] | null | undefined,
  ) => {
    if (!listChanges) return;
    const limit = Math.min(TOP_WINDOW, items.length, listChanges.length);
    for (let i = 0; i < limit; i++) {
      const change = listChanges[i];
      if (!change || change.status !== "up" || change.delta <= 0) continue;
      const item = items[i];
      const candidate: BiggestClimb = {
        category,
        name: item.name,
        detail: item.detail,
        rank: item.rank,
        prevRank: change.prevRank,
        delta: change.delta,
      };
      if (isBetterClimb(candidate, best)) {
        best = candidate;
      }
    }
  };

  inspect("artists", input.artists, changes.artists);
  inspect(
    "albums",
    input.albums.map((a) => ({ rank: a.rank, name: a.name, detail: a.artist })),
    changes.albums,
  );
  inspect(
    "tracks",
    input.tracks.map((tr) => ({ rank: tr.rank, name: tr.name, detail: tr.artist })),
    changes.tracks,
  );

  return best;
}

function isBetterClimb(candidate: BiggestClimb, current: BiggestClimb | null): boolean {
  if (!current) return true;
  if (candidate.delta !== current.delta) return candidate.delta > current.delta;
  if (candidate.rank !== current.rank) return candidate.rank < current.rank;
  return CATEGORY_PRIORITY[candidate.category] < CATEGORY_PRIORITY[current.category];
}

function countNewEntries(input: InsightsInput): NewEntriesStat | null {
  const changes = input.changes;
  if (!changes) return null;

  const pairs: [number, readonly (RankChange | null)[] | null | undefined][] = [
    [input.artists.length, changes.artists],
    [input.tracks.length, changes.tracks],
    [input.albums.length, changes.albums],
  ];

  let count = 0;
  let total = 0;
  for (const [len, list] of pairs) {
    if (!list) continue;
    const limit = Math.min(TOP_WINDOW, len, list.length);
    for (let i = 0; i < limit; i++) {
      const change = list[i];
      if (!change) continue;
      total++;
      if (change.status === "new") count++;
    }
  }

  return total > 0 ? { count, total } : null;
}

function computeTopArtistShare(
  artists: readonly { name: string; playcount: number }[],
  totalScrobbles?: number | null,
): TopArtistShare | null {
  const first = artists[0];
  if (!first || first.playcount <= 0) return null;

  if (typeof totalScrobbles === "number" && totalScrobbles >= first.playcount && totalScrobbles > 0) {
    return {
      name: first.name,
      playcount: first.playcount,
      percent: clampPercent(first.playcount, totalScrobbles),
      basis: "period",
    };
  }

  if (artists.length < 2) return null;
  const topSum = artists.reduce((acc, a) => acc + Math.max(0, a.playcount), 0);
  if (topSum <= 0) return null;

  return {
    name: first.name,
    playcount: first.playcount,
    percent: clampPercent(first.playcount, topSum),
    basis: "top",
  };
}

function computeTopTrackRepeat(
  tracks: readonly { name: string; artist: string; playcount: number }[],
): TopTrackRepeat | null {
  const first = tracks[0];
  if (!first || first.playcount <= 0) return null;

  const second = tracks[1];
  let leadRatio: number | null = null;
  if (second && second.playcount > 0) {
    const raw = first.playcount / second.playcount;
    if (raw >= 1.5) {
      leadRatio = Math.round(raw * 10) / 10;
    }
  }

  return {
    name: first.name,
    artist: first.artist,
    playcount: first.playcount,
    leadRatio,
  };
}
