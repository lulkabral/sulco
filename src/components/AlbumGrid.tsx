"use client";

import { useEffect, useRef, useState } from "react";
import { ExportButtons } from "@/components/ExportButtons";
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

    const getCover = (url: string) => {
      let p = coverCache.current.get(url);
      if (!p) {
        p = loadImage(url).then((img) => {
          // Falhou ou demorou: esquece, para tentar de novo no próximo desenho.
          if (!img) coverCache.current.delete(url);
          return img;
        });
        coverCache.current.set(url, p);
      }
      return p;
    };

    const optionsKey = `${size}-${showCaption}-${showPlays}`;
    let redraw: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const fontFamily = pageFontFamily();
      await waitForFonts(fontFamily);
      if (cancelled) return;

      const needed = albums.slice(0, size * size);
      const px = coverPxFor(GRID_CANVAS_SIDE / size);
      const covers: (HTMLImageElement | null)[] = needed.map(() => null);
      let pending = needed.length;

      const draw = () => {
        redraw = null;
        if (cancelled || !canvasRef.current) return;
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
        if (!redraw) redraw = setTimeout(draw, 30);
      };

      // Capas vêm do servidor de imagens (não da API), então podem vir todas juntas;
      // cada uma entra na grade quando chega, sem esperar as outras.
      if (pending === 0) schedule();
      needed.forEach((a, i) => {
        // Sem capa na lista: pergunta à página do álbum (às vezes ela tem).
        const load = albumCover(a).then((url) => (url ? getCover(coverUrl(url, px)) : null));
        load.then((img) => {
          if (cancelled) return;
          covers[i] = img;
          pending -= 1;
          schedule();
        });
      });
    })();

    return () => {
      cancelled = true;
      if (redraw) clearTimeout(redraw);
    };
  }, [albums, size, showCaption, showPlays, takeSnapshot, lang]);

  if (albums.length === 0) {
    return <p className="text-soft">{t.grid.empty}</p>;
  }

  return (
    <section
      aria-labelledby="grade-titulo"
      className="flex flex-col gap-4 motion-safe:animate-rise md:flex-row md:items-start md:gap-6"
    >
      <h2 id="grade-titulo" className="sr-only">
        {t.grid.heading}
      </h2>

      <div className="above-grain w-full max-w-md self-center transition-transform duration-300 hover:-translate-y-1 md:self-start">
        <canvas
          ref={canvasRef}
          width={GRID_CANVAS_SIDE}
          height={GRID_CANVAS_SIDE}
          // Sem a cópia em <img> (computador), o próprio canvas é a imagem para leitores de tela.
          role={snapshot ? undefined : "img"}
          aria-label={snapshot ? undefined : altText}
          aria-hidden={snapshot ? true : undefined}
          className="block aspect-square w-full rounded-2xl bg-card shadow-2xl shadow-black/50 ring-1 ring-line"
        />
        {snapshot && (
          // Cópia em PNG por cima do canvas: no celular, segurar o dedo abre "Salvar imagem".
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot} alt={altText} className="absolute left-0 top-0 aspect-square w-full rounded-2xl" />
        )}
        {!loading && !complete && (
          <p role="status" className="mt-2 text-center text-xs text-ink-faint">
            {t.grid.completing}
          </p>
        )}
        {loading && (
          <p
            role="status"
            className="absolute left-0 top-0 flex aspect-square w-full items-center justify-center rounded-2xl bg-room/70 text-sm font-semibold text-ink"
          >
            {t.grid.building}
          </p>
        )}
        {snapshot && <SaveHint />}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 md:min-w-72">
        <fieldset>
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-soft">{t.grid.size}</legend>
          <div className="flex gap-2">
            {GRID_SIZES.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="radio"
                  name="grid-size"
                  value={s}
                  checked={size === s}
                  onChange={() => setSize(s)}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-medium text-soft transition hover:text-ink peer-checked:border-amber peer-checked:bg-amber peer-checked:font-bold peer-checked:text-amber-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber">
                  {s}x{s}
                </span>
              </label>
            ))}
          </div>
          {albums.length < size * size && (
            <p className="mt-2 text-sm text-soft">{t.grid.fewAlbums(albums.length)}</p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-soft">{t.grid.show}</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCaption}
              onChange={(e) => setShowCaption(e.target.checked)}
              className="size-4 accent-amber"
            />
            {t.grid.caption}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPlays}
              onChange={(e) => setShowPlays(e.target.checked)}
              className="size-4 accent-amber"
            />
            {t.grid.plays}
          </label>
        </fieldset>

        <ExportButtons
          canvasRef={canvasRef}
          filename={`grade-${username}-${period}-${size}x${size}.png`}
          shareTitle={t.grid.shareTitle(periodLabel)}
          disabled={!complete}
        />
      </div>
    </section>
  );
}
