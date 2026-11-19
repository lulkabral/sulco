"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { drawGrid } from "@/lib/grid/draw";
import { coverUrl } from "@/lib/grid/layout";
import { periodLabel } from "@/lib/periods";
import { albumHeading, dateText, shortTag } from "@/lib/recap/copy";
import { drawRecap, RECAP_HEIGHT, RECAP_WIDTH, type RecapListItem } from "@/lib/recap/draw";
import { paletteById } from "@/lib/recap/palettes";
import type { TrendingCover } from "@/lib/trending";

/** Abas do palco, na ordem do catálogo. "grade" é a grade de álbuns; o resto, formatos do recap. */
const STAGE_TABS = ["toca-discos", "lineup", "mosaico", "grade"] as const;
type StageTab = (typeof STAGE_TABS)[number];

/** Paletas mostradas no palco (as mesmas da imagem de verdade, sem "Cor da capa"). */
const STAGE_PALETTES = ["ambar", "papel", "meia-noite", "vinho", "lilas"] as const;

/** Período do exemplo: "Últimos 30 dias". */
const EXAMPLE_PERIOD = "1month";
/** Reproduções fictícias do exemplo (os números não aparecem: "mostrar números" fica desligado). */
const EXAMPLE_PLAYS = [48, 41, 36, 30, 27, 22, 19, 15, 12];
/** Gêneros do exemplo (genéricos: o exemplo não calcula gêneros de verdade). */
const EXAMPLE_GENRES = ["pop", "indie", "rock"];
const DAY = 86_400;

type Props = {
  /** Capas já buscadas no servidor para a vitrine (nenhuma chamada nova à API do Last.fm aqui). */
  covers: TrendingCover[];
  /** Quantas posições girar a ordem das capas ("ver outro exemplo"). */
  offset: number;
};

/**
 * Palco da página inicial: mostra os formatos reais que o sulco gera, desenhados pelo mesmo
 * código da imagem baixada (drawRecap/drawGrid), com as capas da vitrine como exemplo.
 * O navegador só baixa as imagens das capas, do servidor de imagens do Last.fm.
 */
export function HomePosterPreview({ covers, offset }: Props) {
  const { lang, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<StageTab>("toca-discos");
  const [paletteId, setPaletteId] = useState<string>("ambar");
  const [font, setFont] = useState<string | null>(null);
  const [images, setImages] = useState<(HTMLImageElement | null)[]>(() => covers.map(() => null));

  // Fonte e capas: carregadas uma vez. Cada capa redesenha o palco quando chega.
  useEffect(() => {
    let cancelled = false;
    const family = pageFontFamily();
    waitForFonts(family).then(() => !cancelled && setFont(family));
    covers.forEach((c, i) => {
      loadImage(coverUrl(c.imageUrl, 600)).then((img) => {
        if (!cancelled && img) setImages((prev) => prev.map((x, j) => (j === i ? img : x)));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [covers]);

  // Ordem do exemplo: as capas giradas por `offset`.
  const order = useMemo(() => covers.map((_, i) => (i + offset) % Math.max(covers.length, 1)), [covers, offset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!font || !canvas || covers.length === 0) return;
    const items = order.map((i, rank) => ({ cover: covers[i], image: images[i], plays: EXAMPLE_PLAYS[rank] ?? 10 }));

    if (tab === "grade") {
      // 3x3: as capas se repetem para completar as 9 casas do exemplo.
      const nine = Array.from({ length: 9 }, (_, k) => items[k % items.length]);
      drawGrid(
        canvas,
        nine.map((it) => ({ name: it.cover.name, artist: it.cover.artist, playcount: it.plays, cover: it.image })),
        { size: 3, showCaption: false, showPlays: false, fontFamily: font, lang },
      );
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const albums: RecapListItem[] = items.map((it) => ({ name: it.cover.name, artist: it.cover.artist, playcount: it.plays }));
    const artists: RecapListItem[] = [...new Set(items.map((it) => it.cover.artist))].map((name, k) => ({
      name,
      playcount: EXAMPLE_PLAYS[k] ?? 10,
    }));
    drawRecap(
      canvas,
      {
        username: t.home.exampleUser,
        title: periodLabel(EXAMPLE_PERIOD, lang),
        dateText: dateText(EXAMPLE_PERIOD, now - 30 * DAY, now, undefined, lang),
        shortTag: shortTag(EXAMPLE_PERIOD, lang),
        total: 0,
        minutes: null,
        albumHeading: albumHeading(EXAMPLE_PERIOD, lang),
        artists,
        // Sem nomes de músicas no exemplo: os álbuns fazem esse papel.
        tracks: albums,
        albums,
        covers: items.map((it) => it.image),
        genres: EXAMPLE_GENRES,
        siteHost: window.location.host,
      },
      { layout: tab, palette: paletteById(paletteId), showNumbers: false, font, lang },
    );
  }, [font, images, order, covers, tab, paletteId, lang, t]);

  const tabName = (id: StageTab) => (id === "grade" ? t.home.gridName : t.recap.layouts[id]);
  const isGrid = tab === "grade";

  return (
    <div className="flex h-full flex-col">
      {/* Abas numeradas: formato da prévia. */}
      <div role="group" aria-label={t.home.stageFormats} className="grid grid-cols-2 border-b border-rule sm:grid-cols-4">
        {STAGE_TABS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={
              "flex items-baseline gap-2 border-rule px-4 py-3 text-left text-sm transition-colors max-sm:odd:border-r max-sm:[&:nth-child(-n+2)]:border-b sm:not-last:border-r " +
              (tab === id ? "bg-card text-ink" : "text-soft hover:text-ink")
            }
          >
            <span className={"font-mono text-xs tabular-nums " + (tab === id ? "text-amber" : "text-ink-faint")}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {tabName(id)}
          </button>
        ))}
      </div>

      {/* O pôster, desenhado pelo mesmo código da imagem baixada. */}
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <canvas
          ref={canvasRef}
          width={RECAP_WIDTH}
          height={RECAP_HEIGHT}
          role="img"
          aria-label={t.home.stageAlt(tabName(tab))}
          className={
            "block bg-card shadow-2xl shadow-black/60 ring-1 ring-line " +
            (isGrid ? "aspect-square w-full max-w-[22rem]" : "aspect-[9/16] h-[26rem] w-auto sm:h-[30rem]")
          }
        />
      </div>

      {/* Paletas reais da imagem. Na grade não se aplicam (ela usa sempre o fundo escuro). */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3">
        <div role="group" aria-label={t.home.stagePalettes} className="flex flex-wrap gap-1.5">
          {STAGE_PALETTES.map((id) => {
            const p = paletteById(id);
            const active = paletteId === id && !isGrid;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                disabled={isGrid}
                onClick={() => setPaletteId(id)}
                className={
                  "inline-flex items-center gap-2 rounded-[2px] border px-2 py-1 text-xs transition-colors disabled:opacity-35 " +
                  (active ? "border-ink text-ink" : "border-rule text-soft hover:text-ink")
                }
              >
                <span aria-hidden className="size-3 rounded-full ring-1 ring-white/15" style={{ background: p.accent, boxShadow: `inset 0 0 0 3px ${p.room}` }} />
                {t.recap.palettes[id] ?? p.name}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[11px] tracking-[0.12em] text-ink-faint uppercase">{t.home.stageNote}</p>
      </div>
    </div>
  );
}

