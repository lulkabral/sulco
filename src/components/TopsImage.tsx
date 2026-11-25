"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useReportCoverPalette } from "@/components/AccentScope";
import { ExportButtons } from "@/components/ExportButtons";
import { SaveHint } from "@/components/RecapImage";
import { Swatch } from "@/components/Swatch";
import { VinylLoader } from "@/components/VinylLoader";
import { useI18n } from "@/i18n/client";
import { artistPictures } from "@/lib/artist-image";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { useCanvasSnapshot } from "@/lib/canvas/use-snapshot";
import type { Genre } from "@/lib/genres";
import { coverUrl } from "@/lib/grid/layout";
import type { TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";
import { albumCover, findCover, trackInfo } from "@/lib/lookups";
import { paletteFromCover } from "@/lib/recap/cover-color";
import { COVER_PALETTE_ID, PALETTES, paletteById, type Palette } from "@/lib/recap/palettes";
import { SITE_HOST } from "@/lib/site";
import { drawTopsCard, type TopsCardGenre, type TopsCardItem } from "@/lib/tops-card/draw";
import { albumSharePercent } from "@/lib/tops-card/insights";
import { topsDimensions } from "@/lib/tops-card/layout";
import { pickVinylFinish, sampleCoverRgb } from "@/lib/vinyl-color";
import {
  parseTopsPrefs,
  readTopsPrefsRaw,
  saveTopsPrefs,
  subscribeTopsPrefs,
  TOPS_CARD_KINDS,
  TOPS_COUNTS,
  TOPS_FORMATS,
  type TopsCardKind,
  type TopsPrefs,
} from "@/lib/tops-card/prefs";

type Props = {
  username: string;
  period: string;
  periodLabel: string;
  initialCard?: TopsCardKind | null;
  artists: Pick<TopArtist, "rank" | "name" | "playcount">[];
  tracks: Pick<TopTrack, "rank" | "name" | "artist" | "playcount" | "imageUrl">[];
  albums: Pick<TopAlbum, "rank" | "name" | "artist" | "playcount" | "imageUrl">[];
  genres: Promise<Genre[] | null>;
};

const MAX_ITEMS = 10;
const GENRE_CARD_LIMIT = 5;

/**
 * Aba Tops: gera cards compartilháveis em alta resolução para Artistas, Músicas, Álbuns
 * (Top 5 ou Top 10) e Gêneros (Top 5) nos formatos Stories (9:16) e Quadrado (1:1).
 */
export function TopsImage({
  username,
  period,
  periodLabel,
  initialCard = null,
  artists,
  tracks,
  albums,
  genres,
}: Props) {
  const { lang, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  const [font, setFont] = useState<string | null>(null);
  const imageCache = useRef(new Map<string, Promise<HTMLImageElement | null>>());

  const prefsRaw = useSyncExternalStore(subscribeTopsPrefs, readTopsPrefsRaw, () => null);
  const prefs = useMemo(() => parseTopsPrefs(prefsRaw), [prefsRaw]);
  const choose = (patch: Partial<TopsPrefs>) =>
    saveTopsPrefs({ ...parseTopsPrefs(readTopsPrefsRaw()), ...patch });

  // Quando a pessoa vem de um dos botões "Card" em "O que mais tocou" (?card=...), seleciona a categoria.
  const appliedUrlCard = useRef<TopsCardKind | null>(null);
  useEffect(() => {
    if (!initialCard || appliedUrlCard.current === initialCard) return;
    appliedUrlCard.current = initialCard;
    saveTopsPrefs({ ...parseTopsPrefs(readTopsPrefsRaw()), kind: initialCard });
  }, [initialCard]);

  const kind = prefs.kind;
  const targetCount = prefs.count;

  const [genreList, setGenreList] = useState<Genre[] | null | undefined>(undefined);
  const [loadedImgs, setLoadedImgs] = useState<Record<string, HTMLImageElement | null>>({});
  const [doneKey, setDoneKey] = useState<string | null>(null);

  const reportCoverPalette = useReportCoverPalette();

  // Fonte
  useEffect(() => {
    let cancelled = false;
    const family = pageFontFamily();
    waitForFonts(family).then(() => !cancelled && setFont(family));
    return () => {
      cancelled = true;
    };
  }, []);

  // Gêneros (promessa vinda do servidor ou MonthView)
  useEffect(() => {
    let cancelled = false;
    genres.then((list) => !cancelled && setGenreList(list));
    return () => {
      cancelled = true;
    };
  }, [genres]);

  // Calcula fotos de artista reaproveitando capas já conhecidas do período como fallback.
  const artistPics = useMemo(
    () => artistPictures(artists.slice(0, 20), albums, tracks),
    [artists, albums, tracks],
  );
  const artistPicByName = useMemo(
    () => new Map(artists.slice(0, 20).map((a, i) => [a.name, artistPics[i]])),
    [artists, artistPics],
  );

  // Chaves de imagem necessarias para a combinação atual (kind + count + genres)
  const requiredJobs = useMemo(() => {
    if (kind === "artists") {
      return artists.slice(0, targetCount).map((a, i) => ({
        cacheKey: `artist:${a.name}`,
        isHero: i === 0,
        fetchUrl: () => {
          const pic = artistPics[i];
          return pic?.image ? Promise.resolve(pic.image) : pic?.lookup ? findCover(pic.lookup, i === 0 ? "high" : "low") : Promise.resolve(null);
        },
      }));
    }
    if (kind === "albums") {
      return albums.slice(0, targetCount).map((a) => ({
        cacheKey: `album:${a.artist}\u0000${a.name}`,
        isHero: true,
        fetchUrl: () => albumCover(a),
      }));
    }
    if (kind === "tracks") {
      return tracks.slice(0, 1).map((tr) => ({
        cacheKey: `track:${tr.artist}\u0000${tr.name}`,
        isHero: true,
        fetchUrl: () =>
          tr.imageUrl
            ? Promise.resolve(tr.imageUrl)
            : trackInfo(tr.artist, tr.name, "high").then((info) => info.imageUrl),
      }));
    }
    if (!genreList) return [];
    const seen = new Set<string>();
    const jobs: { cacheKey: string; isHero: boolean; fetchUrl: () => Promise<string | null> }[] = [];
    genreList.slice(0, GENRE_CARD_LIMIT).forEach((g, gi) => {
      g.artists.slice(0, 3).forEach((name, ai) => {
        const key = `artist:${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const pic = artistPicByName.get(name);
        jobs.push({
          cacheKey: key,
          isHero: gi === 0 && ai === 0,
          fetchUrl: () =>
            pic?.image
              ? Promise.resolve(pic.image)
              : pic?.lookup
                ? findCover(pic.lookup, gi === 0 ? "high" : "low")
                : findCover({ type: "artist", artist: name, name }, gi === 0 ? "high" : "low"),
        });
      });
    });
    return jobs;
  }, [kind, targetCount, artists, albums, tracks, genreList, artistPics, artistPicByName]);

  const loadKey = `${period}-${kind}-${kind === "genres" ? (genreList ? genreList.length : "pending") : targetCount}`;

  // Busca URL + HTMLImageElement progressivamente (sem travar e sem CORS taint)
  useEffect(() => {
    let cancelled = false;
    if (kind === "genres" && genreList === undefined) return;

    const pendingJobs = requiredJobs.filter((j) => !(j.cacheKey in loadedImgs));
    if (pendingJobs.length === 0) {
      Promise.resolve().then(() => !cancelled && setDoneKey(loadKey));
      return () => {
        cancelled = true;
      };
    }

    let remaining = pendingJobs.length;
    const settle = () => {
      remaining -= 1;
      if (remaining <= 0 && !cancelled) setDoneKey(loadKey);
    };

    const getCachedImage = (url: string) => {
      let p = imageCache.current.get(url);
      if (!p) {
        p = loadImage(url, 15_000).then((img) => {
          if (!img) imageCache.current.delete(url);
          return img;
        });
        imageCache.current.set(url, p);
      }
      return p;
    };

    for (const job of pendingJobs) {
      job.fetchUrl().then((url) => {
        if (cancelled) return;
        if (!url) {
          setLoadedImgs((prev) => ({ ...prev, [job.cacheKey]: null }));
          settle();
          return;
        }
        const sized = coverUrl(url, job.isHero ? 600 : 300);
        getCachedImage(sized).then((img) => {
          if (cancelled) return;
          setLoadedImgs((prev) => ({ ...prev, [job.cacheKey]: img }));
          settle();
        });
      });
    }

    return () => {
      cancelled = true;
    };
    // `loadedImgs` fica propositalmente de fora para evitar re-disparo a cada imagem resolvida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, requiredJobs, kind, genreList]);

  // Imagem do #1 para extrair "Cor do #1"
  const leadKey = useMemo(() => {
    if (kind === "artists" && artists[0]) return `artist:${artists[0].name}`;
    if (kind === "albums" && albums[0]) return `album:${albums[0].artist}\u0000${albums[0].name}`;
    if (kind === "tracks" && tracks[0]) return `track:${tracks[0].artist}\u0000${tracks[0].name}`;
    if (kind === "genres" && genreList?.[0]?.artists[0]) return `artist:${genreList[0].artists[0]}`;
    return null;
  }, [kind, artists, albums, tracks, genreList]);

  const leadImage = leadKey ? (loadedImgs[leadKey] ?? null) : null;
  const coverPalette: Palette | null = useMemo(
    () => (leadImage ? paletteFromCover(leadImage) : null),
    [leadImage],
  );
  useEffect(() => reportCoverPalette(coverPalette), [coverPalette, reportCoverPalette]);

  const palette =
    prefs.paletteId === COVER_PALETTE_ID ? (coverPalette ?? PALETTES[0]) : paletteById(prefs.paletteId);

  const cardItems: TopsCardItem[] = useMemo(() => {
    if (kind === "artists") {
      return artists.slice(0, MAX_ITEMS).map((a) => ({
        rank: a.rank,
        name: a.name,
        playcount: a.playcount,
        image: loadedImgs[`artist:${a.name}`] ?? null,
      }));
    }
    if (kind === "albums") {
      return albums.slice(0, MAX_ITEMS).map((a) => ({
        rank: a.rank,
        name: a.name,
        detail: a.artist,
        playcount: a.playcount,
        image: loadedImgs[`album:${a.artist}\u0000${a.name}`] ?? null,
      }));
    }
    if (kind === "tracks") {
      return tracks.slice(0, MAX_ITEMS).map((tr) => ({
        rank: tr.rank,
        name: tr.name,
        detail: tr.artist,
        playcount: tr.playcount,
        image: loadedImgs[`track:${tr.artist}\u0000${tr.name}`] ?? null,
      }));
    }
    return [];
  }, [kind, artists, albums, tracks, loadedImgs]);

  const cardGenres: TopsCardGenre[] = useMemo(() => {
    if (!genreList) return [];
    return genreList.slice(0, GENRE_CARD_LIMIT).map((g) => ({
      name: g.name,
      weight: g.weight,
      artists: g.artists,
      artistImages: g.artists.map((name) => loadedImgs[`artist:${name}`] ?? null),
    }));
  }, [genreList, loadedImgs]);

  const albumArtistSharePct: number | null = useMemo(() => {
    if (kind !== "albums" || !albums[0]) return null;
    const topAlbum = albums[0];
    const artistNorm = topAlbum.artist.trim().toLocaleLowerCase("pt-BR");
    const matchingArtist = artists.find((a) => a.name.trim().toLocaleLowerCase("pt-BR") === artistNorm);
    if (!matchingArtist) return null;
    return albumSharePercent(topAlbum.playcount, matchingArtist.playcount);
  }, [kind, albums, artists]);

  // Cor contrastante do vinil colorido no card de Álbuns (mesma lógica da aba Recap)
  const leadAlbumCover = kind === "albums" && albums[0] ? (loadedImgs[`album:${albums[0].artist}\u0000${albums[0].name}`] ?? null) : null;
  const leadAlbumSeed = `${albums[0]?.artist ?? ""}-${albums[0]?.name ?? ""}`;
  const vinylColor = useMemo(() => {
    if (!leadAlbumCover) return null;
    const rgb = sampleCoverRgb(leadAlbumCover);
    return rgb ? pickVinylFinish(rgb, leadAlbumSeed).base : null;
  }, [leadAlbumCover, leadAlbumSeed]);

  const isGenres = kind === "genres";
  const isAlbums = kind === "albums";
  const genresReady = !isGenres || genreList !== undefined;
  const emptyList = isGenres ? genreList !== undefined && cardGenres.length === 0 : cardItems.length === 0;
  const drawn = font !== null && genresReady && !emptyList;
  const complete = drawn && doneKey === loadKey;

  const dims = topsDimensions(prefs.format);

  // Desenho no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!font || !canvas || !genresReady || emptyList) return;
    drawTopsCard(
      canvas,
      {
        username,
        periodLabel,
        items: cardItems,
        genres: cardGenres,
        siteHost: SITE_HOST,
        albumArtistSharePct,
      },
      {
        kind,
        format: prefs.format,
        count: prefs.count,
        palette,
        showNumbers: prefs.showNumbers,
        showUsername: prefs.showUsername,
        vinylColor: isAlbums && prefs.coloredVinyl ? vinylColor : null,
        font,
        lang,
      },
    );
    if (complete) takeSnapshot(canvas);
  }, [
    font,
    genresReady,
    emptyList,
    username,
    periodLabel,
    cardItems,
    cardGenres,
    albumArtistSharePct,
    isAlbums,
    vinylColor,
    kind,
    prefs,
    palette,
    lang,
    complete,
    takeSnapshot,
  ]);

  const kindIndex = Math.max(0, TOPS_CARD_KINDS.indexOf(kind));
  const kindCol = kindIndex % 2;
  const kindRow = Math.floor(kindIndex / 2);
  const formatIndex = Math.max(0, TOPS_FORMATS.indexOf(prefs.format));
  const countIndex = Math.max(0, TOPS_COUNTS.indexOf(prefs.count));
  const activePaletteLabel =
    prefs.paletteId === COVER_PALETTE_ID
      ? t.tops.coverColor
      : (t.recap.palettes[prefs.paletteId] ?? palette.name);
  const kindLabel = t.tops.kinds[kind] ?? kind;
  const altText = t.tops.alt(username, periodLabel, kindLabel);
  const prefix = prefs.showUsername ? `${username}-` : "";
  const filename = `tops-${prefix}${period}-${kind}-${isGenres ? "top5" : `top${prefs.count}`}-${prefs.format}.png`;

  return (
    <section
      id="palco"
      aria-labelledby="tops-titulo"
      className="overflow-hidden rounded-[28px] border border-stage-line bg-stage p-4 text-stage-ink shadow-xl motion-safe:animate-rise sm:p-6 lg:p-8"
    >
      <h2 id="tops-titulo" className="sr-only">
        {t.tops.heading}
      </h2>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-8 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,32rem)_1fr]">
        {/* Prévia */}
        <div
          className={
            "mx-auto w-full transition-[max-width,transform] duration-300 ease-smooth hover:-translate-y-0.5 " +
            (prefs.format === "stories" ? "max-w-xs lg:max-w-[22.5rem] xl:max-w-[24rem]" : "max-w-md lg:max-w-lg")
          }
        >
          <div className={`relative w-full ${prefs.format === "stories" ? "aspect-[9/16]" : "aspect-square"}`}>
            {emptyList ? (
              <div className="flex size-full items-center justify-center rounded-2xl border border-stage-line bg-stage-card p-6 text-center text-sm text-stage-soft">
                {isGenres ? (genreList === null ? t.lists.genresError : t.lists.genresNoTags) : t.tops.empty}
              </div>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  width={dims.exportWidth}
                  height={dims.exportHeight}
                  role={!snapshot ? "img" : undefined}
                  aria-label={!snapshot ? altText : undefined}
                  aria-hidden={Boolean(snapshot) || undefined}
                  className={
                    "block size-full rounded-2xl bg-stage-card shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-opacity duration-300 ease-smooth " +
                    (drawn ? "opacity-100" : "opacity-0")
                  }
                />
                {snapshot && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={snapshot} alt={altText} className="absolute inset-0 z-20 size-full rounded-2xl" />
                )}
                {!drawn && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-stage-card">
                    <VinylLoader label={isGenres && genreList === undefined ? t.tops.completingGenres : t.tops.building} />
                  </div>
                )}
              </>
            )}
          </div>
          {drawn && !complete && (
            <p role="status" className="mt-2 text-center text-xs text-stage-faint">
              {t.tops.completing}
            </p>
          )}
          {complete && <SaveHint />}
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-5 rounded-2xl border border-stage-line bg-stage-card p-4 sm:p-5 lg:p-6">
          <p className="border-b border-stage-line pb-2 text-xs font-bold uppercase tracking-[0.12em] text-amber">
            {periodLabel}
          </p>

          {/* Categoria: Artistas | Músicas | Álbuns | Gêneros */}
          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.tops.category}
            </legend>
            <div className="relative grid grid-cols-2 rounded-2xl border border-stage-line bg-stage p-1 lg:grid-cols-4 lg:rounded-full">
              <span
                aria-hidden
                className="pointer-events-none absolute left-1 top-1 z-0 h-[calc(50%-0.25rem)] w-[calc(50%-0.25rem)] rounded-xl bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none lg:hidden"
                style={{ transform: `translate(${kindCol * 100}%, ${kindRow * 100}%)` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 hidden w-[calc((100%-0.5rem)/4)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none lg:block"
                style={{ transform: `translateX(${kindIndex * 100}%)` }}
              />
              {TOPS_CARD_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  onClick={() => choose({ kind: k })}
                  className={
                    "relative z-10 cursor-pointer whitespace-nowrap rounded-xl px-2.5 py-2 text-center text-sm font-bold transition-colors duration-200 ease-smooth lg:rounded-full " +
                    (kind === k ? "text-amber-ink" : "text-stage-soft hover:text-stage-ink")
                  }
                >
                  {t.tops.kinds[k]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Formato: Stories | Quadrado */}
          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.tops.format}
            </legend>
            <div className="relative grid grid-cols-2 rounded-full border border-stage-line bg-stage p-1">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc((100%-0.5rem)/2)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
                style={{ transform: `translateX(${formatIndex * 100}%)` }}
              />
              {TOPS_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  aria-pressed={prefs.format === fmt}
                  onClick={() => choose({ format: fmt })}
                  className={
                    "relative z-10 cursor-pointer rounded-full px-3 py-2 text-center text-sm font-bold transition-colors duration-200 ease-smooth " +
                    (prefs.format === fmt ? "text-amber-ink" : "text-stage-soft hover:text-stage-ink")
                  }
                >
                  {fmt === "stories" ? t.tops.formatStories : t.tops.formatSquare}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Quantidade: Top 5 | Top 10 (Gêneros mostra Top 5) */}
          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.tops.size}
            </legend>
            {isGenres ? (
              <p className="rounded-xl border border-stage-line bg-stage/60 px-3.5 py-2.5 text-xs text-stage-soft">
                {t.tops.genresTop5Note}
              </p>
            ) : (
              <div className="relative grid grid-cols-2 rounded-full border border-stage-line bg-stage p-1">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc((100%-0.5rem)/2)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
                  style={{ transform: `translateX(${countIndex * 100}%)` }}
                />
                {TOPS_COUNTS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    aria-pressed={prefs.count === cnt}
                    onClick={() => choose({ count: cnt })}
                    className={
                      "relative z-10 cursor-pointer rounded-full px-3 py-2 text-center text-sm font-bold transition-colors duration-200 ease-smooth " +
                      (prefs.count === cnt ? "text-amber-ink" : "text-stage-soft hover:text-stage-ink")
                    }
                  >
                    {t.tops.topN(cnt)}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          {/* Paletas */}
          <fieldset>
            <legend className="mb-2.5 flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              <span>{t.tops.color}</span>
              <span className="text-stage-ink">{activePaletteLabel}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {PALETTES.map((pal) => (
                <Swatch
                  key={pal.id}
                  label={t.recap.palettes[pal.id] ?? pal.name}
                  active={prefs.paletteId === pal.id}
                  onClick={() => choose({ paletteId: pal.id })}
                  background={`linear-gradient(135deg, ${pal.room} 50%, ${pal.accent} 50%)`}
                />
              ))}
              <Swatch
                label={t.tops.coverColor}
                active={prefs.paletteId === COVER_PALETTE_ID}
                onClick={() => choose({ paletteId: COVER_PALETTE_ID })}
                background={
                  coverPalette
                    ? `linear-gradient(135deg, ${coverPalette.room} 50%, ${coverPalette.accent} 50%)`
                    : "conic-gradient(#e8a13a, #ff7aa2, #c59bff, #6fc3ff, #e8a13a)"
                }
              />
            </div>
          </fieldset>

          {/* Switches */}
          <div className="flex flex-col gap-3">
            {isAlbums && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
                <span>
                  <span className="block text-sm font-bold text-stage-ink">{t.recap.coloredVinyl}</span>
                  <span className="block text-xs text-stage-soft">{t.recap.coloredVinylHint}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={prefs.coloredVinyl}
                  onChange={(e) => choose({ coloredVinyl: e.target.checked })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
                />
              </label>
            )}

            {!isGenres && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
                <span>
                  <span className="block text-sm font-bold text-stage-ink">{t.tops.showNumbers}</span>
                  <span className="block text-xs text-stage-soft">{t.tops.showNumbersHint}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={prefs.showNumbers}
                  onChange={(e) => choose({ showNumbers: e.target.checked })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
                />
              </label>
            )}

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
              <span>
                <span className="block text-sm font-bold text-stage-ink">{t.tops.showUsername}</span>
                <span className="block text-xs text-stage-soft">{t.tops.showUsernameHint}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={prefs.showUsername}
                onChange={(e) => choose({ showUsername: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
              />
            </label>
          </div>

          <ExportButtons
            canvasRef={canvasRef}
            filename={filename}
            shareTitle={t.tops.shareTitle(periodLabel, kindLabel)}
            disabled={!complete}
          />
        </div>
      </div>
    </section>
  );
}
