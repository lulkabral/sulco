"use client";

import { useMemo, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { formatNumber, formatPlays } from "@/lib/format";
import { computePeriodInsights, hasPeriodInsights } from "@/lib/list-insights";
import { ListIcon } from "./ListIcons";
import { TrendGlyph, useResolvedRankChanges, type RankChangesInput } from "./RankTrend";

type Props = {
  artists: readonly { rank: number; name: string; playcount: number }[];
  tracks: readonly { rank: number; name: string; artist: string; playcount: number }[];
  albums: readonly { rank: number; name: string; artist: string; playcount: number }[];
  /** Total de scrobbles do período, quando já disponível na página. */
  totalScrobbles?: number | null;
  /** Variações de posição das listas (síncronas ou Promises vindas do servidor). */
  changes?: {
    artists?: RankChangesInput;
    tracks?: RankChangesInput;
    albums?: RankChangesInput;
  };
};

/**
 * Ficha técnica compacta ("Raio-X do período") exibida logo abaixo do cartão terracota
 * de Gêneros no computador (equilibrando a grade 2×2) e abaixo das listas no celular.
 */
export function PeriodHighlights({ artists, tracks, albums, totalScrobbles, changes }: Props) {
  const { lang, t } = useI18n();
  const artistChanges = useResolvedRankChanges(changes?.artists);
  const trackChanges = useResolvedRankChanges(changes?.tracks);
  const albumChanges = useResolvedRankChanges(changes?.albums);

  const insights = useMemo(
    () =>
      computePeriodInsights({
        artists,
        tracks,
        albums,
        totalScrobbles,
        changes: {
          artists: artistChanges.changes,
          tracks: trackChanges.changes,
          albums: albumChanges.changes,
        },
      }),
    [artists, tracks, albums, totalScrobbles, artistChanges.changes, trackChanges.changes, albumChanges.changes],
  );

  if (!hasPeriodInsights(insights)) return null;

  const cards: { key: string; content: ReactNode }[] = [];

  if (insights.biggestClimb) {
    const climb = insights.biggestClimb;
    cards.push({
      key: "climb",
      content: (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-stage-faint">
              {t.lists.insights.biggestClimb}
            </span>
            <span className="rounded-full bg-stage px-2 py-0.5 text-[11px] font-medium text-stage-soft">
              {t.lists.insights.categoryShort[climb.category]}
            </span>
          </div>
          <p className="mt-1.5 break-words text-sm font-extrabold text-stage-ink" title={climb.name}>
            {climb.name}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-trend-up-stage">
            <TrendGlyph status="up" surface="stage" />
            <span className="tabular-nums">
              {t.lists.insights.climbDetail(climb.delta, climb.prevRank)}
            </span>
          </p>
        </>
      ),
    });
  }

  if (insights.newEntries) {
    const { count, total } = insights.newEntries;
    cards.push({
      key: "new",
      content: (
        <>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-stage-faint">
            {t.lists.insights.newEntries}
          </span>
          <p className="mt-1.5 inline-flex items-center gap-2 text-lg font-extrabold leading-tight text-stage-ink tabular-nums">
            {count > 0 && <TrendGlyph status="new" surface="stage" />}
            <span>{t.lists.insights.newEntriesCount(count, total)}</span>
          </p>
          <p className="mt-1 text-xs text-stage-soft">
            {count > 0 ? t.lists.insights.newEntriesHint : t.lists.insights.newEntriesZeroHint}
          </p>
        </>
      ),
    });
  }

  if (insights.topArtistShare) {
    const share = insights.topArtistShare;
    cards.push({
      key: "share",
      content: (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-stage-faint">
              {t.lists.insights.topArtistShare}
            </span>
          </div>
          <p className="mt-1.5 break-words text-sm font-extrabold text-stage-ink" title={share.name}>
            {share.name}
          </p>
          <p className="mt-1 text-xs text-stage-soft">
            {share.basis === "period"
              ? t.lists.insights.shareOfPeriod(share.percent)
              : t.lists.insights.shareOfTop(share.percent)}
          </p>
        </>
      ),
    });
  }

  if (insights.topTrackRepeat) {
    const repeat = insights.topTrackRepeat;
    const playNum = formatNumber(repeat.playcount, lang);
    const playUnit = formatPlays(repeat.playcount, lang).replace(playNum, "").trim();
    cards.push({
      key: "repeat",
      content: (
        <>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-stage-faint">
            {t.lists.insights.repeatTrack}
          </span>
          <p className="mt-1.5 break-words text-sm font-extrabold text-stage-ink" title={repeat.name}>
            {repeat.name}
          </p>
          <p className="truncate text-xs text-stage-soft">{repeat.artist}</p>
          <p className="mt-1.5 text-xs font-medium text-stage-soft">
            <span className="text-sm font-bold text-stage-ink tabular-nums">{playNum}</span>{" "}
            <span>{playUnit}</span>
            {repeat.leadRatio !== null && (
              <span className="font-semibold text-amber">
                {" · "}
                {t.lists.insights.leadRatio(formatNumber(repeat.leadRatio, lang))}
              </span>
            )}
          </p>
        </>
      ),
    });
  }

  return (
    <section
      aria-labelledby="raio-x-titulo"
      className="min-w-0 rounded-[24px] border border-stage-line bg-stage p-5 text-stage-ink"
    >
      <h3
        id="raio-x-titulo"
        className="mb-4 flex items-center gap-2 border-b border-stage-line pb-3 text-xs font-bold uppercase tracking-[0.12em] text-amber"
      >
        <ListIcon name="insights" />
        {t.lists.insights.heading}
      </h3>

      <div className="divide-y divide-stage-line">
        {cards.map((card, index) => (
          <div
            key={card.key}
            className={index === 0
              ? "border-l-2 border-l-amber pb-4 pl-4 [&>p:first-of-type]:text-2xl [&>p:first-of-type]:tracking-tight"
              : "py-3 last:pb-0"}
          >
            {card.content}
          </div>
        ))}
      </div>
    </section>
  );
}
