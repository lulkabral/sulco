"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { VinylLoader } from "@/components/VinylLoader";
import { useI18n } from "@/i18n/client";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { useCanvasSnapshot } from "@/lib/canvas/use-snapshot";
import { SaveHint } from "./RecapImage";
import { drawGrid } from "@/lib/grid/draw";
import { albumCover } from "@/lib/lookups";
import {
  coverPxFor,
  coverUrl,
  gridCells,
  gridFrame,
  GRID_SIZES,
  STORIES_COLUMNS,
  storiesColumns,
  storiesRows,
  type GridFormat,
  type GridSize,
} from "@/lib/grid/layout";
import type { TopAlbum } from "@/lib/lastfm/types";
import { parsePrefs, readPrefsRaw, subscribePrefs } from "@/lib/recap/prefs";

type Props = {
  username: string;
  period: string;
  periodLabel: string;
  albums: Pick<TopAlbum, "name" | "artist" | "playcount" | "imageUrl">[];
};

/** Aba Grade: colagem das capas em canvas, com opções e botão de baixar/compartilhar. */
export function AlbumGrid({ username, period, periodLabel, albums }: Props) {
  // Mesma escolha do recap ("Mostrar meu @"): a grade não desenha o @, mas o nome do arquivo tem.
  const prefsRaw = useSyncExternalStore(subscribePrefs, readPrefsRaw, () => null);
  const { showUsername } = useMemo(() => parsePrefs(prefsRaw), [prefsRaw]);
  const { lang, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  // Capas já carregadas, por endereço: trocar opção não baixa tudo de novo.
  const coverCache = useRef(new Map<string, Promise<HTMLImageElement | null>>());

  const [format, setFormat] = useState<GridFormat>("square");
  const [size, setSize] = useState<GridSize>(3);
  const [showCaption, setShowCaption] = useState(true);
  const [showPlays, setShowPlays] = useState(false);
  /** Chave das opções já desenhadas pelo menos uma vez (com as capas que chegaram). */
  const [drawnKey, setDrawnKey] = useState<string | null>(null);
  /** Chave das opções com todas as capas já desenhadas (libera baixar e compartilhar). */
  const [doneKey, setDoneKey] = useState<string | null>(null);

  const stories = format === "stories";
  // Nos Stories a 5x5 não existe: vale como 4 colunas.
  const cols = stories ? storiesColumns(size) : size;
  const rows = stories ? storiesRows(storiesColumns(size)) : size;
  const frame = gridFrame(format);
  const sizeOptions: readonly GridSize[] = stories ? STORIES_COLUMNS : GRID_SIZES;

  const key = `${format}-${cols}-${showCaption}-${showPlays}`;
  const loading = drawnKey !== key;
  const complete = doneKey === key;
  const altText = t.grid.alt(cols, rows, periodLabel);

  useEffect(() => {
    let cancelled = false;

    const getCover = (url: string, timeoutMs?: number) => {
      let p = coverCache.current.get(url);
      if (!p) {
        p = loadImage(url, timeoutMs).then((img) => {
          // Falhou ou demorou: esquece, para tentar de novo no próximo desenho.
          if (!img) coverCache.current.delete(url);
          return img;
        });
        coverCache.current.set(url, p);
      }
      return p;
    };

    const optionsKey = `${format}-${cols}-${showCaption}-${showPlays}`;
    const fontFamily = pageFontFamily();
    const cells = gridCells(cols, format);
    const needed = albums.slice(0, cells.length);
    const px = coverPxFor(cells[0].side * gridFrame(format).scale);
    const covers: (HTMLImageElement | null)[] = needed.map(() => null);
    const gotHd: boolean[] = needed.map(() => false);
    let fontReady = false;
    let pending = needed.length;
    let redraw: ReturnType<typeof setTimeout> | null = null;

    const draw = () => {
      redraw = null;
      if (cancelled || !fontReady || !canvasRef.current) return;
      drawGrid(
        canvasRef.current,
        needed.map((a, i) => ({ name: a.name, artist: a.artist, playcount: a.playcount, cover: covers[i] })),
        // Sem assinatura: a grade é só das capas (decisão de 16/11/2026).
        { size: cols, format, showCaption, showPlays, fontFamily, lang },
      );
      setDrawnKey(optionsKey);
      if (pending === 0) {
        setDoneKey(optionsKey);
        takeSnapshot(canvasRef.current);
      }
    };
    // Capas que chegam juntas viram um redesenho só.
    const schedule = () => {
      if (fontReady && !redraw) redraw = setTimeout(draw, 30);
    };

    // Fonte e capas baixam em paralelo (antes, as capas só começavam depois da fonte).
    waitForFonts(fontFamily).then(() => {
      if (cancelled) return;
      fontReady = true;
      if (pending === 0 || covers.some(Boolean)) schedule();
    });

    // Capas vêm do servidor de imagens (não da API), então podem vir todas juntas;
    // na 3x3 (600 px) mostra 300 px logo e substitui pelo 600 px nítido quando chegar.
    if (pending === 0) schedule();
    needed.forEach((a, i) => {
      // Sem capa na lista: pergunta à página do álbum (às vezes ela tem).
      albumCover(a).then((url) => {
        if (cancelled) return;
        if (!url) {
          gotHd[i] = true;
          pending -= 1;
          schedule();
          return;
        }
        const hdUrl = coverUrl(url, px);
        if (px !== 300 && !coverCache.current.has(hdUrl)) {
          const fastUrl = coverUrl(url, 300);
          if (fastUrl !== hdUrl) {
            getCover(fastUrl, 8_000).then((fastImg) => {
              if (cancelled || gotHd[i] || !fastImg) return;
              covers[i] = fastImg;
              schedule();
            });
          }
        }
        // A original pesa mais (até ~3 MB): mais tempo antes de desistir (fica a de 300 px).
        getCover(hdUrl, px === "original" ? 30_000 : undefined).then((hdImg) => {
          if (cancelled) return;
          gotHd[i] = true;
          if (hdImg) covers[i] = hdImg;
          pending -= 1;
          schedule();
        });
      });
    });

    return () => {
      cancelled = true;
      if (redraw) clearTimeout(redraw);
    };
  }, [albums, format, cols, showCaption, showPlays, takeSnapshot, lang]);

  if (albums.length === 0) {
    return <p className="text-soft">{t.grid.empty}</p>;
  }

  const sizeIndex = Math.max(0, sizeOptions.indexOf(cols));
  const formatIndex = stories ? 1 : 0;
  const formats: { id: GridFormat; label: string }[] = [
    { id: "square", label: t.grid.formatSquare },
    { id: "stories", label: t.grid.formatStories },
  ];

  return (
    <section
      aria-labelledby="grade-titulo"
      className="overflow-hidden rounded-[28px] border border-stage-line bg-stage p-4 text-stage-ink shadow-xl motion-safe:animate-rise sm:p-6 lg:p-8"
    >
      <h2 id="grade-titulo" className="sr-only">
        {t.grid.heading}
      </h2>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:mx-auto lg:max-w-[70rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-10">
        <div
          className={
            "relative mx-auto w-full " +
            (stories ? "max-w-[18rem] lg:max-w-[26rem]" : "max-w-md lg:max-w-[32rem] xl:max-w-[36rem]")
          }
        >
          <div className={"relative w-full " + (stories ? "aspect-[9/16]" : "aspect-square")}>
            <canvas
              ref={canvasRef}
              width={frame.width * frame.scale}
              height={frame.height * frame.scale}
              // Sem a cópia em <img> (computador), o próprio canvas é a imagem para leitores de tela.
              role={snapshot ? undefined : "img"}
              aria-label={snapshot ? undefined : altText}
              aria-hidden={snapshot ? true : undefined}
              className="block size-full rounded-2xl bg-stage-card shadow-2xl shadow-black/60 ring-1 ring-white/10"
            />
            {snapshot && (
              // Cópia em PNG por cima do canvas: no celular, segurar o dedo abre "Salvar imagem".
              // eslint-disable-next-line @next/next/no-img-element
              <img src={snapshot} alt={altText} className="absolute inset-0 size-full rounded-2xl" />
            )}
            <div
              aria-hidden={!loading}
              className={
                "pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-stage/80 transition-opacity duration-300 ease-smooth " +
                (loading ? "opacity-100" : "opacity-0")
              }
            >
              {loading && <VinylLoader label={t.grid.building} />}
            </div>
          </div>
          {!loading && !complete && (
            <p role="status" className="mt-2 text-center text-xs text-stage-faint">
              {t.grid.completing}
            </p>
          )}
          {snapshot && <SaveHint />}
          <ExportButtons
            canvasRef={canvasRef}
            filename={`grade-${showUsername ? `${username}-` : ""}${period}-${cols}x${rows}${stories ? "-stories" : ""}.png`}
            shareTitle={t.grid.shareTitle(periodLabel)}
            disabled={!complete}
          />
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-stage-line bg-stage-card p-4 sm:p-5 lg:p-6">
          <p className="border-b border-stage-line pb-2 text-xs font-bold uppercase tracking-[0.12em] text-amber">
            {periodLabel}
          </p>

          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.grid.format}
            </legend>
            <div className="relative grid grid-cols-2 rounded-full border border-stage-line bg-stage p-1">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc((100%-0.5rem)/2)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
                style={{ transform: `translateX(${formatIndex * 100}%)` }}
              />
              {formats.map((f) => (
                <label key={f.id} className="relative z-10 cursor-pointer">
                  <input
                    type="radio"
                    name="grid-format"
                    value={f.id}
                    checked={format === f.id}
                    onChange={() => {
                      setFormat(f.id);
                      // A 5x5 vira 4 colunas nos Stories; o seletor mostra a escolha que vale.
                      if (f.id === "stories") setSize(storiesColumns(size));
                    }}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full px-3 py-2 text-center text-sm font-bold text-stage-soft transition-colors duration-200 ease-smooth hover:text-stage-ink peer-checked:text-amber-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
            {stories && <p className="mt-2.5 text-xs text-stage-soft">{t.grid.storiesHint}</p>}
          </fieldset>

          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.grid.size}
            </legend>
            <div
              className="relative grid rounded-full border border-stage-line bg-stage p-1"
              style={{ gridTemplateColumns: `repeat(${sizeOptions.length}, minmax(0, 1fr))` }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
                style={{
                  width: `calc((100% - 0.5rem) / ${sizeOptions.length})`,
                  transform: `translateX(${sizeIndex * 100}%)`,
                }}
              />
              {sizeOptions.map((s) => (
                <label key={s} className="relative z-10 cursor-pointer">
                  <input
                    type="radio"
                    name="grid-size"
                    value={s}
                    checked={cols === s}
                    onChange={() => setSize(s)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full px-3 py-2 text-center text-sm font-bold text-stage-soft transition-colors duration-200 ease-smooth hover:text-stage-ink peer-checked:text-amber-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber tabular-nums">
                    {s}×{stories ? storiesRows(storiesColumns(s)) : s}
                  </span>
                </label>
              ))}
            </div>
            {albums.length < cols * rows && (
              <p className="mt-2.5 text-xs text-stage-soft">{t.grid.fewAlbums(albums.length)}</p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.grid.show}
            </legend>
            <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-stage-line py-3">
              <span className="text-sm font-semibold text-stage-ink">{t.grid.caption}</span>
              <input
                type="checkbox"
                role="switch"
                checked={showCaption}
                onChange={(e) => setShowCaption(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-stage-line py-3">
              <span className="text-sm font-semibold text-stage-ink">{t.grid.plays}</span>
              <input
                type="checkbox"
                role="switch"
                checked={showPlays}
                onChange={(e) => setShowPlays(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
              />
            </label>
          </fieldset>

        </div>
      </div>
    </section>
  );
}
