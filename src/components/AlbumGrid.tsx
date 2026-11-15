"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canShareFiles, canvasToPng, downloadBlob, shareOrDownload } from "@/lib/canvas/export";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { drawGrid } from "@/lib/grid/draw";
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

// Web Share não muda durante a visita: "assina" sem nunca avisar mudança.
const subscribeNever = () => () => {};

/** Aba Grade: colagem das capas em canvas, com opções e botão de baixar/compartilhar. */
export function AlbumGrid({ username, period, periodLabel, albums }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Capas já carregadas, por endereço: trocar opção não baixa tudo de novo.
  const coverCache = useRef(new Map<string, Promise<HTMLImageElement | null>>());

  const [size, setSize] = useState<GridSize>(3);
  const [showCaption, setShowCaption] = useState(true);
  const [showPlays, setShowPlays] = useState(false);
  const [drawnKey, setDrawnKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canShare = useSyncExternalStore(subscribeNever, canShareFiles, () => false);

  const key = `${size}-${showCaption}-${showPlays}`;
  const loading = drawnKey !== key;

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

    (async () => {
      const fontFamily = pageFontFamily();
      await waitForFonts(fontFamily);

      const needed = albums.slice(0, size * size);
      const px = coverPxFor(GRID_CANVAS_SIDE / size);
      // Capas vêm do servidor de imagens (não da API), então podem vir todas juntas.
      const covers = await Promise.all(
        needed.map((a) => (a.imageUrl ? getCover(coverUrl(a.imageUrl, px)) : null)),
      );
      if (cancelled || !canvasRef.current) return;

      drawGrid(
        canvasRef.current,
        needed.map((a, i) => ({ name: a.name, artist: a.artist, playcount: a.playcount, cover: covers[i] })),
        { size, showCaption, showPlays, fontFamily },
      );
      setDrawnKey(`${size}-${showCaption}-${showPlays}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [albums, size, showCaption, showPlays]);

  async function handleExport(share: boolean) {
    if (!canvasRef.current) return;
    setBusy(true);
    try {
      const blob = await canvasToPng(canvasRef.current);
      const filename = `grade-${username}-${period}-${size}x${size}.png`;
      if (share) await shareOrDownload(blob, filename, `Meus álbuns: ${periodLabel.toLowerCase()}`);
      else downloadBlob(blob, filename);
    } finally {
      setBusy(false);
    }
  }

  if (albums.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Nenhum álbum neste período.</p>;
  }

  const buttonBase =
    "rounded-lg px-4 py-2.5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50";

  return (
    <section aria-labelledby="grade-titulo" className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
      <h2 id="grade-titulo" className="sr-only">
        Grade de álbuns
      </h2>

      <div className="relative w-full max-w-md self-center md:self-start">
        <canvas
          ref={canvasRef}
          width={GRID_CANVAS_SIDE}
          height={GRID_CANVAS_SIDE}
          role="img"
          aria-label={`Grade ${size}x${size} com as capas dos álbuns mais ouvidos: ${periodLabel.toLowerCase()}. A lista em texto está abaixo.`}
          className="block aspect-square w-full rounded-lg bg-zinc-900"
        />
        {loading && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/60 text-sm text-white"
          >
            Montando a grade…
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Tamanho</legend>
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
                <span className="inline-block rounded-full border border-zinc-300 px-4 py-1.5 text-sm peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 dark:border-zinc-700">
                  {s}x{s}
                </span>
              </label>
            ))}
          </div>
          {albums.length < size * size && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Só {albums.length} {albums.length === 1 ? "álbum" : "álbuns"} neste período; o resto
              da grade fica vazio.
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Mostrar</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCaption}
              onChange={(e) => setShowCaption(e.target.checked)}
              className="size-4 accent-indigo-600"
            />
            Nome do álbum e artista
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPlays}
              onChange={(e) => setShowPlays(e.target.checked)}
              className="size-4 accent-indigo-600"
            />
            Número de reproduções
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          {canShare && (
            <button
              type="button"
              onClick={() => handleExport(true)}
              disabled={loading || busy}
              className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              Compartilhar
            </button>
          )}
          <button
            type="button"
            onClick={() => handleExport(false)}
            disabled={loading || busy}
            className={
              canShare
                ? `${buttonBase} border border-zinc-300 hover:border-zinc-500 dark:border-zinc-700`
                : `${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700`
            }
          >
            Baixar PNG
          </button>
        </div>
      </div>
    </section>
  );
}
