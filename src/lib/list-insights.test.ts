import { describe, expect, it } from "vitest";
import { computePeriodInsights, hasPeriodInsights } from "./list-insights";
import type { RankChange } from "./rank-change";

describe("computePeriodInsights", () => {
  it("picks the biggest climb across artists, albums and tracks within top 10", () => {
    const artists = [
      { rank: 1, name: "Milo j", playcount: 280 },
      { rank: 2, name: "Charli xcx", playcount: 140 },
    ];
    const albums = [{ rank: 1, name: "BRAT", artist: "Charli xcx", playcount: 110 }];
    const tracks = [{ rank: 1, name: "360", artist: "Charli xcx", playcount: 45 }];

    const artistChanges: (RankChange | null)[] = [
      { status: "same", prevRank: 1 },
      { status: "up", delta: 8, prevRank: 10 },
    ];
    const albumChanges: (RankChange | null)[] = [{ status: "up", delta: 12, prevRank: 13 }];
    const trackChanges: (RankChange | null)[] = [{ status: "up", delta: 12, prevRank: 13 }];

    const result = computePeriodInsights({
      artists,
      albums,
      tracks,
      totalScrobbles: 1000,
      changes: { artists: artistChanges, albums: albumChanges, tracks: trackChanges },
    });

    // Empate de delta=12 e rank=1: álbum vence música pela prioridade de desempate.
    expect(result.biggestClimb).toEqual({
      category: "albums",
      name: "BRAT",
      detail: "Charli xcx",
      rank: 1,
      prevRank: 13,
      delta: 12,
    });
  });

  it("ignores climbs past rank 10 so expanded items don't skew the top-10 snapshot", () => {
    const artists = Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1,
      name: `Artist ${i + 1}`,
      playcount: 100 - i,
    }));
    const changes: (RankChange | null)[] = artists.map((_, i) =>
      i === 11 ? { status: "up", delta: 40, prevRank: 52 } : { status: "same", prevRank: i + 1 },
    );

    const result = computePeriodInsights({
      artists,
      albums: [],
      tracks: [],
      changes: { artists: changes },
    });

    expect(result.biggestClimb).toBeNull();
  });

  it("counts new entries across available top-10 comparisons", () => {
    const result = computePeriodInsights({
      artists: [
        { rank: 1, name: "A", playcount: 50 },
        { rank: 2, name: "B", playcount: 30 },
      ],
      tracks: [
        { rank: 1, name: "T1", artist: "A", playcount: 20 },
        { rank: 2, name: "T2", artist: "B", playcount: 10 },
      ],
      albums: [{ rank: 1, name: "AL1", artist: "A", playcount: 40 }],
      changes: {
        artists: [{ status: "new" }, { status: "same", prevRank: 2 }],
        tracks: [{ status: "new" }, { status: "down", delta: 2, prevRank: 1 }],
        albums: [{ status: "up", delta: 3, prevRank: 4 }],
      },
    });

    expect(result.newEntries).toEqual({ count: 2, total: 5 });
  });

  it("omits comparison stats when there are no rank changes (e.g. overall)", () => {
    const result = computePeriodInsights({
      artists: [
        { rank: 1, name: "Milo j", playcount: 250 },
        { rank: 2, name: "Rosalía", playcount: 100 },
      ],
      tracks: [
        { rank: 1, name: "M.A.I", artist: "Milo j", playcount: 42 },
        { rank: 2, name: "Rara Vez", artist: "Milo j", playcount: 20 },
      ],
      albums: [],
      totalScrobbles: 1000,
    });

    expect(result.biggestClimb).toBeNull();
    expect(result.newEntries).toBeNull();
    expect(result.topArtistShare).toEqual({
      name: "Milo j",
      playcount: 250,
      percent: 25,
      basis: "period",
    });
    expect(result.topTrackRepeat).toEqual({
      name: "M.A.I",
      artist: "Milo j",
      playcount: 42,
      leadRatio: 2.1,
    });
    expect(hasPeriodInsights(result)).toBe(true);
  });

  it("falls back to share of loaded top when totalScrobbles is unavailable (grid tab)", () => {
    const result = computePeriodInsights({
      artists: [
        { rank: 1, name: "A", playcount: 60 },
        { rank: 2, name: "B", playcount: 40 },
      ],
      tracks: [
        { rank: 1, name: "T1", artist: "A", playcount: 15 },
        { rank: 2, name: "T2", artist: "B", playcount: 12 },
      ],
      albums: [],
      totalScrobbles: null,
    });

    expect(result.topArtistShare).toEqual({
      name: "A",
      playcount: 60,
      percent: 60,
      basis: "top",
    });
    // 15 / 12 = 1.25 < 1.5 -> omite leadRatio
    expect(result.topTrackRepeat?.leadRatio).toBeNull();
  });

  it("returns empty insights cleanly for empty lists", () => {
    const result = computePeriodInsights({ artists: [], tracks: [], albums: [] });
    expect(hasPeriodInsights(result)).toBe(false);
  });
});
