"use client";

import { useEffect, useRef, useState } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { useCanvasSnapshot } from "@/lib/canvas/use-snapshot";
import { SaveHint } from "./RecapImage";
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

/** Aba Grade: colagem das capas em canvas, com opções e botão de baixar/compartilhar. */
export function AlbumGrid({ username, period, periodLabel, albums }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  // Capas já carregadas, por endereço: trocar opção não baixa tudo de novo.
  const coverCache = useRef(new Map<string, Promise<HTMLImageElement | null>>());

  const [size, setSize] = useState<GridSize>(3);
  const [showCaption, setShowCaption] = useState(true);
  const [showPlays, setShowPlays] = useState(false);
  const [drawnKey, setDrawnKey] = useState<string | null>(null);

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
        // Sem assinatura: a grade é só das capas (decisão de 16/11/2026).
        { size, showCaption, showPlays, fontFamily },
      );
      void takeSnapshot(canvasRef.current);
      setDrawnKey(`${size}-${showCaption}-${showPlays}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [albums, size, showCaption, showPlays, takeSnapshot]);

  if (albums.length === 0) {
    return <p className="text-ink-soft">Nenhum álbum neste período.</p>;
  }

  return (
    <section
      aria-labelledby="grade-titulo"
      className="flex flex-col gap-4 motion-safe:animate-rise md:flex-row md:items-start md:gap-6"
    >
      <h2 id="grade-titulo" className="sr-only">
        Grade de álbuns
      </h2>

      <div className="relative w-full max-w-md self-center transition-transform duration-300 hover:-translate-y-1 md:self-start">
        <canvas
          ref={canvasRef}
          width={GRID_CANVAS_SIDE}
          height={GRID_CANVAS_SIDE}
          aria-hidden
          className="block aspect-square w-full rounded-2xl bg-card shadow-2xl shadow-black/50 ring-1 ring-line"
        />
        {snapshot && (
          // Cópia em PNG por cima do canvas: no celular, segurar o dedo abre "Salvar imagem".
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot}
            alt={`Grade ${size}x${size} com as capas dos álbuns mais ouvidos: ${periodLabel.toLowerCase()}. A lista em texto está abaixo.`}
            className="absolute left-0 top-0 aspect-square w-full rounded-2xl"
          />
        )}
        {loading && (
          <p
            role="status"
            className="absolute left-0 top-0 flex aspect-square w-full items-center justify-center rounded-2xl bg-room/70 text-sm font-semibold text-ink"
          >
            Montando a grade…
          </p>
        )}
        {snapshot && <SaveHint />}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 md:min-w-72">
        <fieldset>
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">Tamanho</legend>
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
                <span className="inline-block rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink peer-checked:border-amber peer-checked:bg-amber peer-checked:font-bold peer-checked:text-amber-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber">
                  {s}x{s}
                </span>
              </label>
            ))}
          </div>
          {albums.length < size * size && (
            <p className="mt-2 text-sm text-ink-soft">
              Só {albums.length} {albums.length === 1 ? "álbum" : "álbuns"} neste período; o resto
              da grade fica vazio.
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">Mostrar</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCaption}
              onChange={(e) => setShowCaption(e.target.checked)}
              className="size-4 accent-amber"
            />
            Nome do álbum e artista
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPlays}
              onChange={(e) => setShowPlays(e.target.checked)}
              className="size-4 accent-amber"
            />
            Número de reproduções
          </label>
        </fieldset>

        <ExportButtons
          canvasRef={canvasRef}
          filename={`grade-${username}-${period}-${size}x${size}.png`}
          shareTitle={`Meus álbuns: ${periodLabel.toLowerCase()}`}
          disabled={loading}
        />
      </div>
    </section>
  );
}
