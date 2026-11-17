"use client";

import { artistPictures } from "@/lib/artist-image";
import { useEffect, useMemo, useState } from "react";
import { AlbumGrid } from "@/components/AlbumGrid";
import { ErrorState } from "@/components/ErrorState";
import { GenreItems, GenreListView } from "@/components/GenreListView";
import { RecapImage } from "@/components/RecapImage";
import { TopList } from "@/components/TopList";
import { useI18n } from "@/i18n/client";
import { aggregateScrobbles, type MonthTops } from "@/lib/aggregate";
import { formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import type { ErrorCode } from "@/lib/lastfm/types";
import { MAX_SCROBBLE_PAGES } from "@/lib/lastfm/validate";
import { ApiCallError, loadGenres, loadMonthScrobbles, loadYearTops, type MonthProgress } from "@/lib/month-loader";
import { monthRange, parseYearId, yearRange } from "@/lib/months";
import type { Tab } from "@/lib/tabs";

type Props = {
  username: string;
  /** Mês "AAAA-MM" (soma de scrobbles) ou ano "AAAA" (gráficos do Last.fm). */
  period: string;
  /** Nome do período para a tela e a imagem: "Outubro de 2026", "2026 até agora". */
  label: string;
  tab: Tab;
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
    };

const LIST_LIMIT = 10;
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
export function MonthView({ username, period, label, tab }: Props) {
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
    const year = parseYearId(period);
    const range = year ? yearRange(year, Date.now() / 1000) : monthRange(period);
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
        setState({ status: "ready", tops, range: { from: range.from, to: range.to }, truncated, genres });
      } catch (err) {
        if (signal.aborted) return;
        setState({ status: "error", code: err instanceof ApiCallError ? err.code : "LASTFM_DOWN" });
      }
    })();

    // Saiu da página ou trocou de mês: cancela os pedidos que ainda estão no ar.
    return () => controller.abort();
  }, [username, period, coversNeeded, attempt]);

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

  const { tops, range, truncated, genres } = state;
  const artistPics = artistPictures(tops.artists, tops.albums, tops.tracks);
  const artistPicsByName = Object.fromEntries(tops.artists.map((a, i) => [a.name, artistPics[i]]));
  if (tops.total === 0 || !recapData) {
    return (
      <div className="rounded-2xl bg-card p-5">
        <h2 className="text-lg font-semibold">{t.month.noMusicTitle(label)}</h2>
        <p className="mt-1 text-ink-soft">{t.month.noMusicBody}</p>
      </div>
    );
  }

  return (
    <>
      {truncated && (
        <p role="note" className="rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm text-ink">
          {t.month.truncated(formatNumber(MAX_SCROBBLE_PAGES * 200, lang), formatNumber(tops.total, lang))}
        </p>
      )}

      {tab === "grade" ? (
        <AlbumGrid username={username} period={period} periodLabel={label} albums={recapData.grid} />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TopList
          title={t.lists.artists}
          icon="artists"
          shape="round"
          items={tops.artists.slice(0, LIST_LIMIT).map((a, i) => ({
            rank: a.rank,
            name: a.name,
            playcount: a.playcount,
            url: a.url,
            image: artistPics[i].image,
            lookup: artistPics[i].lookup,
          }))}
        />
        <TopList
          title={t.lists.tracks}
          icon="tracks"
          items={tops.tracks.slice(0, LIST_LIMIT).map((t) => ({
            rank: t.rank,
            name: t.name,
            detail: t.artist,
            playcount: t.playcount,
            url: t.url,
            image: t.imageUrl ?? null,
            lookup: { type: "track", artist: t.artist, name: t.name },
          }))}
        />
        <TopList
          title={t.lists.albums}
          icon="albums"
          items={tops.albums.slice(0, LIST_LIMIT).map((a) => ({
            rank: a.rank,
            name: a.name,
            detail: a.artist,
            playcount: a.playcount,
            url: a.url,
            image: a.imageUrl,
            lookup: { type: "album", artist: a.artist, name: a.name },
          }))}
        />
        <GenreListView>
          <GenreItems genres={genreList} images={artistPicsByName} />
        </GenreListView>
      </div>
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
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-5">
      <p role="status" className="text-ink">
        {text}
      </p>
      <div
        role="progressbar"
        aria-label={t.month.progressLabel}
        aria-valuemin={0}
        aria-valuemax={progress?.totalPages}
        aria-valuenow={progress?.pagesDone}
        className="h-2 w-full overflow-hidden rounded-full bg-line"
      >
        {progress ? (
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round((progress.pagesDone / (progress.totalPages || 1)) * 100)}%` }}
          />
        ) : (
          // Ainda sem saber quantas páginas: um trecho âmbar indo e voltando.
          <div className="h-full w-1/3 rounded-full bg-amber motion-safe:animate-scan" />
        )}
      </div>
    </div>
  );
}
