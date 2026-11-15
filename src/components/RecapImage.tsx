"use client";

import { useEffect, useRef, useState } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { cssFontFamily, loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { formatDateRange } from "@/lib/format";
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
      const serif = cssFontFamily("--font-fraunces", "Georgia, serif");
      await waitForFonts(sans, serif);

      const first = albums[0] ?? null;
      // Capa e gêneros chegam em paralelo.
      const [cover, genreList] = await Promise.all([
        first?.imageUrl ? loadImage(coverUrl(first.imageUrl, 600)) : null,
        genres,
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
          genres: genreList ? genreList.map((g) => g.name) : null,
          siteHost: window.location.host,
        },
        { serif, sans },
      );
      setDrawn(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [username, periodLabel, from, to, total, genres, artists, tracks, albums]);

  return (
    <section aria-labelledby="recap-titulo" className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
      <h2 id="recap-titulo" className="sr-only">
        Imagem do recap
      </h2>

      <div className="relative w-full max-w-xs self-center md:self-start">
        <canvas
          ref={canvasRef}
          width={RECAP_WIDTH}
          height={RECAP_HEIGHT}
          role="img"
          aria-label={`Recap de ${username}: ${periodLabel.toLowerCase()}. Os tops em texto estão abaixo.`}
          className="block aspect-[9/16] w-full rounded-lg bg-[#F3EEE4] shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
        />
        {!drawn && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center rounded-lg text-sm text-zinc-600"
          >
            Montando o recap…
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-zinc-600 dark:text-zinc-400">
          Imagem no formato story (1080 × 1920), pronta para compartilhar.
        </p>
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
