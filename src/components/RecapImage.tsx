"use client";

import { useEffect, useRef, useState } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { formatDateRange, formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import { coverUrl } from "@/lib/grid/layout";
import { drawRecap, RECAP_HEIGHT, RECAP_WIDTH, type RecapListItem } from "@/lib/recap/draw";

type Props = {
  username: string;
  period: string;
  periodLabel: string;
  /** Intervalo do período (timestamps UNIX em segundos), para mostrar as datas. */
  from: number;
  to: number;
  total: number;
  /** Gêneros calculados no servidor; chegam depois do resto (null = não deu para calcular). */
  genres: Promise<Genre[] | null>;
  artists: RecapListItem[];
  tracks: RecapListItem[];
  albums: (RecapListItem & { imageUrl: string | null })[];
};

/** Aba Recap: imagem story (1080 x 1920) desenhada no canvas, com baixar/compartilhar. */
export function RecapImage(props: Props) {
  const { username, period, periodLabel, from, to, total, genres, artists, tracks, albums } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const sans = pageFontFamily();
      await waitForFonts(sans);

      const first = albums[0] ?? null;
      // Capa grande do nº 1, capas da fileira do topo (2 a 5) e gêneros chegam em paralelo.
      const [cover, genreList, ...rest] = await Promise.all([
        first?.imageUrl ? loadImage(coverUrl(first.imageUrl, 600)) : null,
        genres,
        ...albums.slice(1, 5).map((a) => (a.imageUrl ? loadImage(a.imageUrl) : null)),
      ]);
      if (cancelled || !canvasRef.current) return;

      drawRecap(
        canvasRef.current,
        {
          username,
          title: periodLabel,
          // Datas no fuso do aparelho de quem gera a imagem.
          dateRange: formatDateRange(from, to),
          total,
          artists,
          tracks,
          albums,
          featured: first ? { ...first, cover } : null,
          stripCovers: [cover, ...rest],
          genres: genreList ? genreList.map((g) => g.name) : null,
          siteHost: window.location.host,
        },
        { sans },
      );
      setDrawn(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [username, periodLabel, from, to, total, genres, artists, tracks, albums]);

  return (
    <section
      aria-labelledby="recap-titulo"
      className="flex flex-col gap-4 motion-safe:animate-rise md:flex-row md:items-start md:gap-6"
    >
      <h2 id="recap-titulo" className="sr-only">
        Imagem do recap
      </h2>

      <div className="relative w-full max-w-xs self-center transition-transform duration-300 hover:-translate-y-1 md:self-start">
        <canvas
          ref={canvasRef}
          width={RECAP_WIDTH}
          height={RECAP_HEIGHT}
          role="img"
          aria-label={`Recap de ${username}: ${periodLabel.toLowerCase()}. Os tops em texto estão abaixo.`}
          className="block aspect-[9/16] w-full rounded-2xl bg-card shadow-2xl shadow-black/50 ring-1 ring-line"
        />
        {!drawn && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center rounded-2xl text-sm font-semibold text-ink-soft"
          >
            Montando o recap…
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 md:min-w-72">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-ink-soft">{periodLabel}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight text-amber tabular-nums">
            {formatNumber(total)}
          </p>
          <p className="text-ink-soft">scrobbles</p>
        </div>
        <p className="text-sm text-ink-soft">Imagem no formato story (1080 × 1920), pronta para compartilhar.</p>
        <ExportButtons
          canvasRef={canvasRef}
          filename={`recap-${username}-${period}.png`}
          shareTitle={`Meu recap: ${periodLabel.toLowerCase()}`}
          disabled={!drawn}
        />
      </div>
    </section>
  );
}
