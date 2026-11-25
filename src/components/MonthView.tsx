"use client";

import { artistPictures } from "@/lib/artist-image";
import { useEffect, useMemo, useState } from "react";
import { AlbumGrid } from "@/components/AlbumGrid";
import { AlbumTopList } from "@/components/AlbumTopList";
import { ErrorState } from "@/components/ErrorState";
import { GenreItems, GenreListView } from "@/components/GenreListView";
import { PeriodHighlights } from "@/components/PeriodHighlights";
import { ProfileLists } from "@/components/ProfileLists";
import { RecapImage } from "@/components/RecapImage";
import { TopList } from "@/components/TopList";
import { TopsImage } from "@/components/TopsImage";
import { useI18n } from "@/i18n/client";
import { VinylLoader } from "./VinylLoader";
import { aggregateScrobbles, type MonthTops } from "@/lib/aggregate";
import { formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import type { ErrorCode, TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";
import { MAX_SCROBBLE_PAGES } from "@/lib/lastfm/validate";
import {
  ApiCallError,
  loadChartSnapshot,
  loadGenres,
  loadMonthScrobbles,
  loadQuickGenres,
  loadYearTops,
  type MonthProgress,
} from "@/lib/month-loader";
import { monthRange, parseYearId, yearRange } from "@/lib/months";
import {
  computeGenreRankChanges,
  computeRankChanges,
  PREV_CHART_LIMIT,
  PREV_GENRE_ARTISTS,
  PREV_GENRE_LIMIT,
  previousHistoryPeriod,
  rankKey,
  type RankChange,
} from "@/lib/rank-change";
import { userPageHref, type Tab } from "@/lib/tabs";
import type { TopsCardKind } from "@/lib/tops-card/prefs";

type Props = {
  username: string;
  /** Mês "AAAA-MM" (soma de scrobbles) ou ano "AAAA" (gráficos do Last.fm). */
  period: string;
  /** Nome do período para a tela e a imagem: "Outubro de 2026", "2026 até agora". */
  label: string;
  tab: Tab;
  /** Categoria pré-selecionada para a aba Tops (?card=...). */
  initialCard?: TopsCardKind | null;
  /** Data de cadastro no Last.fm (evita buscar período anterior a ela). */
  registeredAt?: number;
};

type TrendPromises = {
  artists: Promise<(RankChange | null)[] | null>;
  tracks: Promise<(RankChange | null)[] | null>;
  albums: Promise<(RankChange | null)[] | null>;
  genres: Promise<(RankChange | null)[] | null>;
};

type State =
  | { status: "loading"; progress: MonthProgress | null }
  | { status: "error"; code: ErrorCode }
  | {
      status: "ready";
      tops: MonthTops;
      range: { from: number; to: number };
      truncated: boolean;
      genres: Promise<Genre[] | null>;
      trends: TrendPromises | null;
    };

const LIST_LIMIT = 10;
const EXPANDED_LIMIT = 20;
/** Itens na imagem do recap: até 15 artistas (Lineup), 5 músicas e 9 álbuns (Mosaico). */
const RECAP_ARTISTS = 15;
const RECAP_TRACKS = 5;
/** Músicas usadas para estimar os minutos (as mesmas da lista "Músicas"). */
const MINUTE_SAMPLE = 10;
const RECAP_ALBUMS = 9;
const GRID_LIMIT = 25;

/**
 * Mês ou ano escolhido no calendário: um mês fechado ou um ano inteiro.
 * - Mês: busca as páginas de scrobbles pela nossa rota e soma aqui no navegador.
 * - Ano: 3 chamadas de gráfico + as capas dos álbuns que aparecem (ver loadYearTops).
 * O servidor não guarda nem soma nada. Depois, mostra recap, grade e listas.
 */
export function MonthView({ username, period, label, tab, initialCard = null, registeredAt = 0 }: Props) {
  const { lang, t } = useI18n();
  const [state, setState] = useState<State>({ status: "loading", progress: null });
  const [genreList, setGenreList] = useState<Genre[] | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  // A aba só muda o que é carregado no ano (quantas capas). No mês, trocar de aba
  // não recarrega nada: os mesmos dados servem para o recap e para a grade.
  const coversNeeded = parseYearId(period) ? (tab === "grade" ? GRID_LIMIT : RECAP_ALBUMS) : 0;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const onProgress = (progress: MonthProgress) => setState({ status: "loading", progress });
    // Começo e fim do mês ou do ano no fuso deste aparelho.
    const nowSeconds = Date.now() / 1000;
    const year = parseYearId(period);
    const range = year ? yearRange(year, nowSeconds) : monthRange(period);
    if (!range) return;

    (async () => {
      try {
        let tops: MonthTops;
        let truncated = false;
        if (year) {
          // Só as capas que vão aparecer: 25 na grade, 9 na imagem do recap.
          tops = await loadYearTops(username, range, coversNeeded, onProgress, signal);
        } else {
          const data = await loadMonthScrobbles(username, range, onProgress, signal);
          tops = aggregateScrobbles(data.scrobbles);
          truncated = data.truncated;
        }
        const genres = loadGenres(tops.artists, signal);
        genres.then((g) => !signal.aborted && setGenreList(g));

        // Comparação com o mês ou ano anterior em segundo plano (1 chamada por vez,
        // somada às 3 de gêneros = máx. 4 simultâneas; nunca derruba a tela se falhar).
        const prev = previousHistoryPeriod(period, nowSeconds, registeredAt);
        let trends: TrendPromises | null = null;
        if (prev && tops.total > 0) {
          const prevArtistsP = loadChartSnapshot(username, "artists", prev.range, PREV_CHART_LIMIT, signal)
            .then((items) => items as TopArtist[] | null)
            .catch(() => null);
          const prevTracksP = prevArtistsP.then(() =>
            signal.aborted
              ? null
              : loadChartSnapshot(username, "tracks", prev.range, PREV_CHART_LIMIT, signal)
                  .then((items) => items as TopTrack[] | null)
                  .catch(() => null),
          );
          const prevAlbumsP = prevTracksP.then(() =>
            signal.aborted
              ? null
              : loadChartSnapshot(username, "albums", prev.range, PREV_CHART_LIMIT, signal)
                  .then((items) => items as TopAlbum[] | null)
                  .catch(() => null),
          );

          const displayedArtists = tops.artists.slice(0, EXPANDED_LIMIT);
          const displayedTracks = tops.tracks.slice(0, EXPANDED_LIMIT);
          const displayedAlbums = tops.albums.slice(0, EXPANDED_LIMIT);

          const artists = prevArtistsP.then((p) =>
            p
              ? computeRankChanges(
                  displayedArtists,
                  p,
                  (a) => rankKey(a.name),
                  (a) => rankKey(a.name),
                  (a) => a.rank,
                  (a) => a.rank,
                )
              : null,
          );
          const tracks = prevTracksP.then((p) =>
            p
              ? computeRankChanges(
                  displayedTracks,
                  p,
                  (tr) => rankKey(tr.artist, tr.name),
                  (tr) => rankKey(tr.artist, tr.name),
                  (tr) => tr.rank,
                  (tr) => tr.rank,
                )
              : null,
          );
          const albums = prevAlbumsP.then((p) =>
            p
              ? computeRankChanges(
                  displayedAlbums,
                  p,
                  (a) => rankKey(a.artist, a.name),
                  (a) => rankKey(a.artist, a.name),
                  (a) => a.rank,
                  (a) => a.rank,
                )
              : null,
          );
          const genreTrends = Promise.all([genres, prevArtistsP]).then(async ([curr, prevArtists]) => {
            if (signal.aborted || !curr || curr.length === 0 || !prevArtists || prevArtists.length === 0) {
              return null;
            }
            const prevGenres = await loadQuickGenres(
              prevArtists.slice(0, PREV_GENRE_ARTISTS).map((a) => ({ name: a.name, playcount: a.playcount })),
              signal,
              PREV_GENRE_LIMIT,
            ).catch(() => null);
            return prevGenres ? computeGenreRankChanges(curr, prevGenres) : null;
          });
          trends = { artists, tracks, albums, genres: genreTrends };
        }

        setState({
          status: "ready",
          tops,
          range: { from: range.from, to: range.to },
          truncated,
          genres,
          trends,
        });
      } catch (err) {
        if (signal.aborted) return;
        setState({ status: "error", code: err instanceof ApiCallError ? err.code : "LASTFM_DOWN" });
      }
    })();

    // Saiu da página ou trocou de mês: cancela os pedidos que ainda estão no ar.
    return () => controller.abort();
  }, [username, period, coversNeeded, registeredAt, attempt]);

  function retry() {
    setState({ status: "loading", progress: null });
    setGenreList(undefined);
    setAttempt((n) => n + 1);
  }

  // Listas para a imagem e a grade. useMemo: mesmas listas entre renderizações,
  // para a imagem não ser redesenhada à toa.
  const ready = state.status === "ready" ? state : null;
  const recapData = useMemo(() => {
    if (!ready) return null;
    const { tops } = ready;
    return {
      artists: tops.artists.slice(0, RECAP_ARTISTS).map((a) => ({ name: a.name, playcount: a.playcount })),
      tracks: tops.tracks
        .slice(0, RECAP_TRACKS)
        .map((t) => ({ name: t.name, artist: t.artist, playcount: t.playcount })),
      albums: tops.albums.slice(0, RECAP_ALBUMS).map((a) => ({
        name: a.name,
        artist: a.artist,
        playcount: a.playcount,
        imageUrl: a.imageUrl,
      })),
      minuteSample: tops.tracks
        .slice(0, MINUTE_SAMPLE)
        .map((t) => ({ name: t.name, artist: t.artist, playcount: t.playcount })),
      grid: tops.albums.slice(0, GRID_LIMIT).map((a) => ({
        name: a.name,
        artist: a.artist,
        playcount: a.playcount,
        imageUrl: a.imageUrl,
      })),
    };
  }, [ready]);

  if (state.status === "loading") {
    return <MonthProgressBar label={label} progress={state.progress} />;
  }
  if (state.status === "error") {
    return <ErrorState code={state.code} username={username} onRetry={retry} />;
  }

  const { tops, range, truncated, genres, trends } = state;
  const artistPics = artistPictures(tops.artists, tops.albums, tops.tracks);
  const artistPicsByName = Object.fromEntries(tops.artists.map((a, i) => [a.name, artistPics[i]]));
  if (tops.total === 0 || !recapData) {
    return (
      <div className="rounded-[24px] border border-line bg-card p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-ink">{t.month.noMusicTitle(label)}</h2>
        <p className="mt-1 text-soft">{t.month.noMusicBody}</p>
      </div>
    );
  }

  const cardHref = (kind: TopsCardKind) => `${userPageHref(username, "tops", period, lang, kind)}#palco`;

  return (
    <>
      {truncated && (
        <p role="note" className="rounded-2xl border border-terra/40 bg-terra/10 p-4 text-sm text-ink">
          {t.month.truncated(formatNumber(MAX_SCROBBLE_PAGES * 200, lang), formatNumber(tops.total, lang))}
        </p>
      )}

      {tab === "grade" ? (
        <AlbumGrid username={username} period={period} periodLabel={label} albums={recapData.grid} />
      ) : tab === "tops" ? (
        <TopsImage
          username={username}
          period={period}
          periodLabel={label}
          initialCard={initialCard}
          artists={tops.artists}
          tracks={tops.tracks}
          albums={tops.albums}
          genres={genres}
        />
      ) : (
        <RecapImage
          username={username}
          period={period}
          periodLabel={label}
          from={range.from}
          to={range.to}
          total={tops.total}
          genres={genres}
          artists={recapData.artists}
          tracks={recapData.tracks}
          albums={recapData.albums}
          minuteSample={recapData.minuteSample}
        />
      )}

      <ProfileLists
        artists={
          <TopList
            title={t.lists.artists}
            icon="artists"
            shape="round"
            variant="artists"
            initialLimit={LIST_LIMIT}
            changes={trends?.artists}
            cardHref={cardHref("artists")}
            items={tops.artists.slice(0, EXPANDED_LIMIT).map((a, i) => ({
              rank: a.rank,
              name: a.name,
              playcount: a.playcount,
              url: a.url,
              image: artistPics[i].image,
              lookup: artistPics[i].lookup,
            }))}
          />
        }
        tracks={
          <TopList
            title={t.lists.tracks}
            icon="tracks"
            variant="tracks"
            initialLimit={LIST_LIMIT}
            changes={trends?.tracks}
            cardHref={cardHref("tracks")}
            items={tops.tracks.slice(0, EXPANDED_LIMIT).map((t) => ({
              rank: t.rank,
              name: t.name,
              detail: t.artist,
              playcount: t.playcount,
              url: t.url,
              image: t.imageUrl ?? null,
              lookup: { type: "track", artist: t.artist, name: t.name },
            }))}
          />
        }
        albums={
          <AlbumTopList
            initialLimit={LIST_LIMIT}
            changes={trends?.albums}
            cardHref={cardHref("albums")}
            items={tops.albums.slice(0, EXPANDED_LIMIT).map((a) => ({
              rank: a.rank,
              name: a.name,
              detail: a.artist,
              playcount: a.playcount,
              url: a.url,
              image: a.imageUrl,
              lookup: { type: "album", artist: a.artist, name: a.name },
            }))}
          />
        }
        genres={
          <GenreListView cardHref={cardHref("genres")}>
            <GenreItems genres={genreList} images={artistPicsByName} changes={trends?.genres} />
          </GenreListView>
        }
        highlights={
          <PeriodHighlights
            artists={tops.artists.slice(0, EXPANDED_LIMIT).map((a) => ({
              rank: a.rank,
              name: a.name,
              playcount: a.playcount,
            }))}
            tracks={tops.tracks.slice(0, EXPANDED_LIMIT).map((tr) => ({
              rank: tr.rank,
              name: tr.name,
              artist: tr.artist,
              playcount: tr.playcount,
            }))}
            albums={tops.albums.slice(0, EXPANDED_LIMIT).map((al) => ({
              rank: al.rank,
              name: al.name,
              artist: al.artist,
              playcount: al.playcount,
            }))}
            totalScrobbles={tops.total}
            changes={
              trends
                ? {
                    artists: trends.artists,
                    tracks: trends.tracks,
                    albums: trends.albums,
                  }
                : undefined
            }
          />
        }
      />
    </>
  );
}

function MonthProgressBar({ label, progress }: { label: string; progress: MonthProgress | null }) {
  const { t } = useI18n();
  const text = !progress
    ? t.month.fetching(label)
    : progress.unit === "capa"
      ? t.month.fetchingCovers(label, progress.pagesDone, progress.totalPages)
      : t.month.readingPages(label, progress.pagesDone, progress.totalPages);
  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-stage-line bg-stage p-6 text-stage-ink">
      <VinylLoader label={text} />
      {/* Quando já se sabe quantas páginas são, a barra mostra quanto falta. */}
      {progress && (
        <div
          role="progressbar"
          aria-label={t.month.progressLabel}
          aria-valuemin={0}
          aria-valuemax={progress.totalPages}
          aria-valuenow={progress.pagesDone}
          className="h-2 w-full max-w-md overflow-hidden rounded-full bg-stage-line"
        >
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-300 ease-smooth"
            style={{ width: `${Math.round((progress.pagesDone / (progress.totalPages || 1)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
