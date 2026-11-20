"use client";

import { useEffect, useRef, useState } from "react";
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
  GRID_CANVAS_SIDE,
  GRID_SIZES,
  type GridSize,
} from "@/lib/grid/layout";
import type { TopAlbum } from "@/lib/lastfm/types";

type Props = {
  username: string;
  period: string;
  periodLabel: string;
  albums: Pick<TopAlbum, "name" | "artist" | "playcount" | "imageUrl">[];
};

/** Aba Grade: colagem das capas em canvas, com opções e botão de baixar/compartilhar. */
export function AlbumGrid({ username, period, periodLabel, albums }: Props) {
  const { lang, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  // Capas já carregadas, por endereço: trocar opção não baixa tudo de novo.
  const coverCache = useRef(new Map<string, Promise<HTMLImageElement | null>>());

  const [size, setSize] = useState<GridSize>(3);
  const [showCaption, setShowCaption] = useState(true);
  const [showPlays, setShowPlays] = useState(false);
  /** Chave das opções já desenhadas pelo menos uma vez (com as capas que chegaram). */
  const [drawnKey, setDrawnKey] = useState<string | null>(null);
  /** Chave das opções com todas as capas já desenhadas (libera baixar e compartilhar). */
  const [doneKey, setDoneKey] = useState<string | null>(null);

  const key = `${size}-${showCaption}-${showPlays}`;
  const loading = drawnKey !== key;
  const complete = doneKey === key;
  const altText = t.grid.alt(size, periodLabel);

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

    const optionsKey = `${size}-${showCaption}-${showPlays}`;
    const fontFamily = pageFontFamily();
    const needed = albums.slice(0, size * size);
    const px = coverPxFor(GRID_CANVAS_SIDE / size);
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
        { size, showCaption, showPlays, fontFamily, lang },
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
        if (px > 300 && !coverCache.current.has(hdUrl)) {
          const fastUrl = coverUrl(url, 300);
          if (fastUrl !== hdUrl) {
            getCover(fastUrl, 8_000).then((fastImg) => {
              if (cancelled || gotHd[i] || !fastImg) return;
              covers[i] = fastImg;
              schedule();
            });
          }
        }
        getCover(hdUrl).then((hdImg) => {
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
  }, [albums, size, showCaption, showPlays, takeSnapshot, lang]);

  if (albums.length === 0) {
    return <p className="text-soft">{t.grid.empty}</p>;
  }

  const sizeIndex = Math.max(0, GRID_SIZES.indexOf(size));

  return (
    <section
      aria-labelledby="grade-titulo"
      className="overflow-hidden rounded-[28px] border border-stage-line bg-stage p-4 text-stage-ink shadow-xl motion-safe:animate-rise sm:p-6 lg:p-8"
    >
      <h2 id="grade-titulo" className="sr-only">
        {t.grid.heading}
      </h2>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-8 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,36rem)_1fr]">
        <div className="relative mx-auto w-full max-w-md transition-transform duration-300 ease-smooth hover:-translate-y-0.5 lg:max-w-[32rem] xl:max-w-[36rem]">
          <div className="relative aspect-square w-full">
            <canvas
              ref={canvasRef}
              width={GRID_CANVAS_SIDE}
              height={GRID_CANVAS_SIDE}
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
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-stage-line bg-stage-card p-4 sm:p-5 lg:p-6">
          <p className="border-b border-stage-line pb-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-amber">
            {periodLabel}
          </p>

          <fieldset>
            <legend className="mb-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-stage-faint">
              {t.grid.size}
            </legend>
            <div className="relative grid grid-cols-3 rounded-full border border-stage-line bg-stage p-1">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc((100%-0.5rem)/3)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
                style={{ transform: `translateX(${sizeIndex * 100}%)` }}
              />
              {GRID_SIZES.map((s) => (
                <label key={s} className="relative z-10 cursor-pointer">
                  <input
                    type="radio"
                    name="grid-size"
                    value={s}
                    checked={size === s}
                    onChange={() => setSize(s)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full px-3 py-2 text-center font-mono text-sm font-bold text-stage-soft transition-colors duration-200 ease-smooth hover:text-stage-ink peer-checked:text-amber-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber">
                    {s}×{s}
                  </span>
                </label>
              ))}
            </div>
            {albums.length < size * size && (
              <p className="mt-2.5 text-xs text-stage-soft">{t.grid.fewAlbums(albums.length)}</p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-stage-faint">
              {t.grid.show}
            </legend>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
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
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
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

          <ExportButtons
            canvasRef={canvasRef}
            filename={`grade-${username}-${period}-${size}x${size}.png`}
            shareTitle={t.grid.shareTitle(periodLabel)}
            disabled={!complete}
          />
        </div>
      </div>
    </section>
  );
}
