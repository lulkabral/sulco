"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swatch } from "@/components/Swatch";
import { VinylLoader } from "@/components/VinylLoader";
import { useI18n } from "@/i18n/client";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { drawGrid } from "@/lib/grid/draw";
import { coverUrl } from "@/lib/grid/layout";
import { periodLabel } from "@/lib/periods";
import { albumHeading, dateText, shortTag } from "@/lib/recap/copy";
import { paletteFromCover } from "@/lib/recap/cover-color";
import { drawRecap, RECAP_HEIGHT, RECAP_WIDTH, type RecapListItem } from "@/lib/recap/draw";
import { COVER_PALETTE_ID, paletteById, type Palette } from "@/lib/recap/palettes";
import type { TrendingCover } from "@/lib/trending";

/** Abas do palco. "grade" é a grade de álbuns; o resto, formatos do recap. */
const STAGE_TABS = ["toca-discos", "lineup", "mosaico", "grade"] as const;
type StageTab = (typeof STAGE_TABS)[number];

/** Paletas fixas mostradas no palco (além da opção dinâmica "Cor da capa"). */
const STAGE_PALETTES = ["ambar", "papel", "meia-noite", "vinho", "lilas"] as const;

const EXAMPLE_PERIOD = "1month";
const EXAMPLE_PLAYS = [48, 41, 36, 30, 27, 22, 19, 15, 12];
const EXAMPLE_GENRES = ["pop", "indie", "rock"];
const DAY = 86_400;

type Props = {
  /** Capas já buscadas no servidor para a vitrine (nenhuma chamada nova à API do Last.fm aqui). */
  covers: TrendingCover[];
  /** Quantas posições girar a ordem das capas (sincronizado com a faixa de discos). */
  offset: number;
  /** Cor de vinil contrastante do disco ativo (sincronizada com o topo e a vitrine). */
  vinylColor?: string | null;
  /** Avança para o próximo disco da vitrine. */
  onNext: () => void;
};

/**
 * Palco da página inicial: mostra os formatos reais que o sulco gera, desenhados pelo mesmo
 * código da imagem baixada (drawRecap/drawGrid), dentro de um cartão escuro dedicado
 * para as imagens saltarem tanto no modo claro quanto no modo escuro.
 */
export function HomePosterPreview({ covers, offset, vinylColor = null, onNext }: Props) {
  const { lang, t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<StageTab>("toca-discos");
  const [paletteId, setPaletteId] = useState<string>("ambar");
  const [coloredVinyl, setColoredVinyl] = useState(true);
  const [font, setFont] = useState<string | null>(null);
  const [images, setImages] = useState<(HTMLImageElement | null)[]>(() => covers.map(() => null));

  // Fonte e capas: carregadas uma vez. Na prévia da página inicial (não baixada), 300 px
  // já fica nítido e vem rápido da borda do Fastly (600 px no Last.fm pode levar vários segundos).
  useEffect(() => {
    let cancelled = false;
    const family = pageFontFamily();
    waitForFonts(family).then(() => !cancelled && setFont(family));
    covers.forEach((c, i) => {
      loadImage(coverUrl(c.imageUrl, 300)).then((img) => {
        if (!cancelled && img) setImages((prev) => prev.map((x, j) => (j === i ? img : x)));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [covers]);

  // Ordem do exemplo: as capas giradas a partir do disco escolhido na vitrine.
  const order = useMemo(() => covers.map((_, i) => (i + offset) % Math.max(covers.length, 1)), [covers, offset]);

  const leadImage = images[order[0] ?? 0] ?? null;
  const coverPalette: Palette | null = useMemo(() => (leadImage ? paletteFromCover(leadImage) : null), [leadImage]);
  const palette = paletteId === COVER_PALETTE_ID ? (coverPalette ?? paletteById("ambar")) : paletteById(paletteId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!font || !canvas || covers.length === 0) return;
    const items = order.map((i, rank) => ({ cover: covers[i], image: images[i], plays: EXAMPLE_PLAYS[rank] ?? 10 }));

    if (tab === "grade") {
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
        tracks: albums,
        albums,
        covers: items.map((it) => it.image),
        genres: EXAMPLE_GENRES,
        siteHost: window.location.host,
      },
      { layout: tab, palette, showNumbers: false, vinylColor: coloredVinyl ? vinylColor : null, font, lang },
    );
  }, [font, images, order, covers, tab, palette, coloredVinyl, vinylColor, lang, t]);

  const tabName = (id: StageTab) => (id === "grade" ? t.home.gridName : t.recap.layouts[id]);
  const isGrid = tab === "grade";
  const isTurntable = tab === "toca-discos";
  const activePaletteLabel = isGrid
    ? t.home.gridClean
    : paletteId === COVER_PALETTE_ID
      ? t.recap.coverColor
      : (t.recap.palettes[paletteId] ?? palette.name);

  return (
    <section id="palco" aria-labelledby="palco-titulo" className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
      <div className="overflow-hidden rounded-[28px] border border-stage-line bg-stage p-5 text-stage-ink shadow-xl sm:p-7 lg:p-9">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          {/* Controles do palco */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-mono text-xs font-medium tracking-[0.14em] text-amber uppercase">
                {t.home.stageEyebrow}
              </p>
              <h2 id="palco-titulo" className="mt-1.5 text-2xl font-extrabold tracking-tight text-stage-ink sm:text-3xl">
                {t.home.stageHeading}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-stage-soft">{t.home.stageBody}</p>
            </div>

            {/* Abas de formato em pílulas táteis */}
            <div role="group" aria-label={t.home.stageFormats} className="flex flex-wrap gap-2">
              {STAGE_TABS.map((id) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTab(id)}
                    className={
                      "rounded-full px-4 py-2 text-xs font-bold transition duration-200 ease-smooth active:scale-[0.98] sm:text-sm " +
                      (active
                        ? "bg-amber text-amber-ink"
                        : "border border-stage-line text-stage-soft hover:border-stage-faint hover:text-stage-ink")
                    }
                  >
                    {tabName(id)}
                  </button>
                );
              })}
            </div>

            {/* Paletas em bolinhas + botão trocar disco */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stage-line bg-stage-card p-4">
              <div className="flex flex-col gap-2.5">
                <p className="font-mono text-xs tracking-[0.1em] text-stage-faint uppercase">
                  {t.recap.color}: <span className="font-semibold text-stage-ink">{activePaletteLabel}</span>
                </p>
                <div role="group" aria-label={t.home.stagePalettes} className="flex flex-wrap items-center gap-2.5">
                  {STAGE_PALETTES.map((id) => {
                    const p = paletteById(id);
                    return (
                      <Swatch
                        key={id}
                        label={t.recap.palettes[id] ?? p.name}
                        active={paletteId === id && !isGrid}
                        disabled={isGrid}
                        onClick={() => setPaletteId(id)}
                        background={`linear-gradient(135deg, ${p.room} 50%, ${p.accent} 50%)`}
                      />
                    );
                  })}
                  <Swatch
                    label={t.recap.coverColor}
                    active={paletteId === COVER_PALETTE_ID && !isGrid}
                    disabled={isGrid}
                    onClick={() => setPaletteId(COVER_PALETTE_ID)}
                    background={
                      coverPalette
                        ? `linear-gradient(135deg, ${coverPalette.room} 50%, ${coverPalette.accent} 50%)`
                        : "conic-gradient(#e8a13a, #ff7aa2, #c59bff, #6fc3ff, #e8a13a)"
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onNext}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stage-line px-3.5 py-2 text-xs font-semibold text-stage-ink transition duration-200 ease-smooth hover:border-stage-faint active:scale-[0.98]"
              >
                <span aria-hidden className="inline-block transition-transform duration-300 ease-smooth group-hover:rotate-90">
                  ↻
                </span>
                {t.home.swapDisc}
              </button>
            </div>

            {isTurntable && (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line bg-stage-card px-4 py-3 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full ring-1 ring-white/25 transition-colors duration-300 ease-smooth"
                    style={{ backgroundColor: coloredVinyl && vinylColor ? vinylColor : "var(--color-vinyl)" }}
                  />
                  <span className="text-sm font-bold text-stage-ink">{t.recap.coloredVinyl}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={coloredVinyl}
                  onChange={(e) => setColoredVinyl(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
                />
              </label>
            )}
          </div>

          {/* O pôster real (intacto!) */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={RECAP_WIDTH}
                height={RECAP_HEIGHT}
                role="img"
                aria-label={t.home.stageAlt(tabName(tab))}
                className={
                  "block rounded-2xl bg-stage-card shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-shadow duration-300 ease-smooth " +
                  (isGrid ? "aspect-square w-full max-w-[21rem]" : "aspect-[9/16] h-[25rem] w-auto sm:h-[29rem]")
                }
              />
              {!font && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-stage-card">
                  <VinylLoader />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
