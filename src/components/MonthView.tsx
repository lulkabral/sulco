"use client";

import { useEffect, useMemo, useState } from "react";
import { AlbumGrid } from "@/components/AlbumGrid";
import { ErrorState } from "@/components/ErrorState";
import { GenreItems, GenreListView } from "@/components/GenreListView";
import { RecapImage } from "@/components/RecapImage";
import { TopList } from "@/components/TopList";
import { aggregateScrobbles, type MonthTops } from "@/lib/aggregate";
import { formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import type { ErrorCode } from "@/lib/lastfm/types";
import { MAX_SCROBBLE_PAGES } from "@/lib/lastfm/validate";
import { ApiCallError, loadGenres, loadMonthScrobbles, type MonthProgress } from "@/lib/month-loader";
import { monthLabel, monthRange } from "@/lib/months";
import type { Tab } from "@/lib/tabs";

type Props = {
  username: string;
  /** Mês no formato "AAAA-MM". */
  month: string;
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
const RECAP_ALBUMS = 9;
const GRID_LIMIT = 25;

/**
 * Mês fechado: busca as páginas de scrobbles pela nossa rota, soma aqui no navegador
 * (o servidor não guarda nem soma nada) e mostra recap, grade e listas.
 */
export function MonthView({ username, month, tab }: Props) {
  const [state, setState] = useState<State>({ status: "loading", progress: null });
  const [genreList, setGenreList] = useState<Genre[] | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const label = monthLabel(month);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    // Começo e fim do mês no fuso deste aparelho.
    const range = monthRange(month);
    if (!range) return;

    (async () => {
      try {
        const data = await loadMonthScrobbles(
          username,
          range,
          (progress) => setState({ status: "loading", progress }),
          signal,
        );
        const tops = aggregateScrobbles(data.scrobbles);
        const genres = loadGenres(tops.artists, signal);
        genres.then((g) => !signal.aborted && setGenreList(g));
        setState({ status: "ready", tops, range, truncated: data.truncated, genres });
      } catch (err) {
        if (signal.aborted) return;
        setState({ status: "error", code: err instanceof ApiCallError ? err.code : "LASTFM_DOWN" });
      }
    })();

    // Saiu da página ou trocou de mês: cancela os pedidos que ainda estão no ar.
    return () => controller.abort();
  }, [username, month, attempt]);

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
  if (tops.total === 0 || !recapData) {
    return (
      <div className="rounded-2xl bg-card p-5">
        <h2 className="text-lg font-semibold">Nenhuma música em {label.toLowerCase()}</h2>
        <p className="mt-1 text-ink-soft">
          Não há scrobbles neste mês. Tente outro mês ou um dos períodos acima.
        </p>
      </div>
    );
  }

  return (
    <>
      {truncated && (
        <p role="note" className="rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm text-ink">
          Este mês tem mais de {formatNumber(MAX_SCROBBLE_PAGES * 200)} scrobbles. Para não
          sobrecarregar o Last.fm, a conta usa só os {formatNumber(tops.total)} mais recentes do mês.
        </p>
      )}

      {tab === "grade" ? (
        <AlbumGrid username={username} period={month} periodLabel={label} albums={recapData.grid} />
      ) : (
        <RecapImage
          username={username}
          period={month}
          periodLabel={label}
          from={range.from}
          to={range.to}
          total={tops.total}
          genres={genres}
          artists={recapData.artists}
          tracks={recapData.tracks}
          albums={recapData.albums}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TopList
          title="Artistas"
          items={tops.artists.slice(0, LIST_LIMIT).map((a) => ({
            rank: a.rank,
            name: a.name,
            playcount: a.playcount,
            url: a.url,
          }))}
        />
        <TopList
          title="Músicas"
          items={tops.tracks.slice(0, LIST_LIMIT).map((t) => ({
            rank: t.rank,
            name: t.name,
            detail: t.artist,
            playcount: t.playcount,
            url: t.url,
          }))}
        />
        <TopList
          title="Álbuns"
          items={tops.albums.slice(0, LIST_LIMIT).map((a) => ({
            rank: a.rank,
            name: a.name,
            detail: a.artist,
            playcount: a.playcount,
            url: a.url,
          }))}
        />
        <GenreListView>
          <GenreItems genres={genreList} />
        </GenreListView>
      </div>
    </>
  );
}

function MonthProgressBar({ label, progress }: { label: string; progress: MonthProgress | null }) {
  const text = progress
    ? `Lendo seus scrobbles de ${label.toLowerCase()}: página ${progress.pagesDone} de ${progress.totalPages}`
    : `Buscando seus scrobbles de ${label.toLowerCase()}…`;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-5">
      <p role="status" className="text-ink">
        {text}
      </p>
      <div
        role="progressbar"
        aria-label="Progresso da leitura dos scrobbles"
        aria-valuemin={0}
        aria-valuemax={progress?.totalPages}
        aria-valuenow={progress?.pagesDone}
        className="h-2 w-full overflow-hidden rounded-full bg-line"
      >
        {progress ? (
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round((progress.pagesDone / progress.totalPages) * 100)}%` }}
          />
        ) : (
          // Ainda sem saber quantas páginas: um trecho âmbar indo e voltando.
          <div className="h-full w-1/3 rounded-full bg-amber motion-safe:animate-scan" />
        )}
      </div>
    </div>
  );
}
