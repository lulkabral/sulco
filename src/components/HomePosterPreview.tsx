"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swatch } from "@/components/Swatch";
import { VinylLoader } from "@/components/VinylLoader";
import { useI18n } from "@/i18n/client";
import { pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { drawGrid } from "@/lib/grid/draw";
import { periodLabel } from "@/lib/periods";
import { albumHeading, dateText, shortTag } from "@/lib/recap/copy";
import { paletteFromCover } from "@/lib/recap/cover-color";
import { drawRecap, RECAP_HEIGHT, RECAP_SCALE, RECAP_WIDTH, type RecapListItem } from "@/lib/recap/draw";

/** O palco desenha em 1x (é só exemplo): canvas com metade do tamanho da imagem baixada. */
const STAGE_W = RECAP_WIDTH / RECAP_SCALE;
const STAGE_H = RECAP_HEIGHT / RECAP_SCALE;
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
  /** Imagens 300×300 já carregadas com CORS no topo (evita baixar duas vezes). */
  images: (HTMLImageElement | null)[];
  /** Quantas posições girar a ordem das capas (sincronizado com a faixa de discos). */
  offset: number;
  /** Cor de vinil contrastante do disco ativo (sincronizada com a vitrine). */
  vinylColor?: string | null;
  /** Avança para o próximo disco da vitrine. */
  onNext: () => void;
};

/**
 * Palco compacto já na 1ª tela da página inicial: mostra os formatos reais que o sulco gera,
 * desenhados pelo mesmo código da imagem baixada (drawRecap/drawGrid), com a imagem como
 * protagonista — abas em 1 linha acima e cores/controles enxutos logo abaixo para ver tudo
 * mudar ao vivo sem rolar a página.
 */
export function HomePosterPreview({ covers, images, offset, vinylColor = null, onNext }: Props) {
  const { lang, t } = useI18n();
  const canvas0Ref = useRef<HTMLCanvasElement>(null);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Dois slots de canvas alternados: ao trocar de formato, o anterior some em fade suave
  // enquanto o novo entra no centro — sem corte seco mesmo entre 9:16 e Grade 1:1.
  const [stage, setStage] = useState<{ active: 0 | 1; tabs: [StageTab, StageTab] }>({
    active: 0,
    tabs: ["toca-discos", "toca-discos"],
  });
  const [paletteId, setPaletteId] = useState<string>("ambar");
  const [coloredVinyl, setColoredVinyl] = useState(true);
  const [font, setFont] = useState<string | null>(null);

  const tab = stage.tabs[stage.active];
  const tabIndex = STAGE_TABS.indexOf(tab);

  function selectTab(next: StageTab) {
    setStage((prev) => {
      if (prev.tabs[prev.active] === next) return prev;
      const nextActive: 0 | 1 = prev.active === 0 ? 1 : 0;
      const nextTabs: [StageTab, StageTab] = [...prev.tabs];
      nextTabs[nextActive] = next;
      return { active: nextActive, tabs: nextTabs };
    });
  }

  useEffect(() => {
    let cancelled = false;
    const family = pageFontFamily();
    waitForFonts(family).then(() => !cancelled && setFont(family));
    return () => {
      cancelled = true;
    };
  }, []);

  // Posiciona e ajusta a largura da pílula âmbar conforme o botão ativo (cada aba ocupa só
  // o espaço proporcional ao seu texto, sem cortar "Toca-discos" nem "Cuadrícula" no celular).
  useEffect(() => {
    const rail = railRef.current;
    const pill = pillRef.current;
    if (!rail || !pill) return;

    const sync = () => {
      const btn = tabRefs.current[tabIndex];
      if (!btn) return;
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
      pill.style.width = `${btn.offsetWidth}px`;
      rail.dataset.ready = "true";
    };

    sync();
    let raf = 0;
    if (!rail.dataset.animate) {
      raf = requestAnimationFrame(() => {
        rail.dataset.animate = "true";
      });
    }

    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [tabIndex, lang, font]);

  // Ordem do exemplo: as capas giradas a partir do disco escolhido na vitrine.
  const order = useMemo(() => covers.map((_, i) => (i + offset) % Math.max(covers.length, 1)), [covers, offset]);

  const leadImage = images[order[0] ?? 0] ?? null;
  const coverPalette: Palette | null = useMemo(() => (leadImage ? paletteFromCover(leadImage) : null), [leadImage]);
  const palette = paletteId === COVER_PALETTE_ID ? (coverPalette ?? paletteById("ambar")) : paletteById(paletteId);

  useEffect(() => {
    const canvas = stage.active === 0 ? canvas0Ref.current : canvas1Ref.current;
    if (!font || !canvas || covers.length === 0) return;
    const items = order.map((i, rank) => ({ cover: covers[i], image: images[i] ?? null, plays: EXAMPLE_PLAYS[rank] ?? 10 }));

    if (tab === "grade") {
      // A vitrine tem até 9 álbuns: com 9, nenhuma capa repete (com menos, repete as primeiras).
      const nine = Array.from({ length: 9 }, (_, k) => items[k % items.length]);
      drawGrid(
        canvas,
        nine.map((it) => ({ name: it.cover.name, artist: it.cover.artist, playcount: it.plays, cover: it.image })),
        // Palco é só exemplo: desenha em 1x (mais leve que a imagem baixada, em 1,5x).
        { size: 3, showCaption: false, showPlays: false, fontFamily: font, lang, scale: 1 },
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
      { layout: tab, palette, showNumbers: false, vinylColor: coloredVinyl ? vinylColor : null, font, lang, scale: 1 },
    );
  }, [font, images, order, covers, stage.active, tab, palette, coloredVinyl, vinylColor, lang, t]);

  const tabName = (id: StageTab) => (id === "grade" ? t.home.gridName : t.recap.layouts[id]);
  const isGrid = tab === "grade";
  const isTurntable = tab === "toca-discos";

  return (
    <div
      id="palco"
      tabIndex={-1}
      aria-labelledby="palco-titulo"
      className="flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-stage-line bg-stage p-3.5 text-stage-ink sm:gap-4 sm:p-5"
    >
      <h2 id="palco-titulo" className="sr-only">
        {t.home.stageHeading}
      </h2>

      {/* 1. Abas de formato proporcionais em uma única linha com pílula âmbar que desliza suave */}
      <div
        ref={railRef}
        role="group"
        aria-label={t.home.stageFormats}
        className="group/rail no-scrollbar relative flex items-center overflow-x-auto rounded-full border border-stage-line bg-stage-card p-1"
      >
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-0 z-0 rounded-full bg-amber opacity-0 shadow-sm duration-300 ease-smooth group-data-[animate]/rail:transition-[transform,width] group-data-[ready]/rail:opacity-100 motion-reduce:transition-none"
        />
        {STAGE_TABS.map((id, i) => {
          const active = tab === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              aria-pressed={active}
              onClick={() => selectTab(id)}
              className={
                "relative z-10 flex-auto whitespace-nowrap rounded-full px-2 py-1.5 text-center text-xs font-bold transition-colors duration-200 ease-smooth sm:px-3.5 sm:py-2 sm:text-sm " +
                (active
                  ? "bg-amber text-amber-ink group-data-[ready]/rail:bg-transparent"
                  : "text-stage-soft hover:text-stage-ink")
              }
            >
              {tabName(id)}
            </button>
          );
        })}
      </div>

      {/* 2. A imagem real gerada — dois slots com crossfade suave e altura estável */}
      <div className="relative h-[min(24rem,52dvh)] w-full sm:h-[min(30rem,58dvh)]">
        {([0, 1] as const).map((slot) => {
          const isActive = slot === stage.active;
          const slotTab = stage.tabs[slot];
          const slotIsGrid = slotTab === "grade";
          return (
            <div
              key={slot}
              aria-hidden={!isActive}
              className={
                "absolute inset-0 flex items-center justify-center transition-[opacity,transform] ease-smooth motion-reduce:transition-none " +
                (isActive
                  ? "z-10 scale-100 opacity-100 duration-300"
                  : "pointer-events-none z-0 scale-[0.96] opacity-0 duration-200")
              }
            >
              <div
                className={
                  slotIsGrid
                    ? "relative w-full max-w-[min(18rem,52dvh)] sm:max-w-[min(22.5rem,58dvh)]"
                    : "relative h-full"
                }
              >
                <canvas
                  ref={slot === 0 ? canvas0Ref : canvas1Ref}
                  width={STAGE_W}
                  height={STAGE_H}
                  role={isActive ? "img" : undefined}
                  aria-label={isActive ? t.home.stageAlt(tabName(slotTab)) : undefined}
                  className={
                    "block rounded-2xl bg-stage-card shadow-2xl shadow-black/60 ring-1 ring-white/10 " +
                    (slotIsGrid ? "aspect-square w-full" : "aspect-[9/16] h-full w-auto")
                  }
                />
              </div>
            </div>
          );
        })}

        {!font && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex aspect-[9/16] h-full items-center justify-center rounded-2xl bg-stage-card ring-1 ring-white/10">
              <VinylLoader />
            </div>
          </div>
        )}
      </div>

      {/* 3. Barra compacta de cores, vinil colorido e troca de disco logo abaixo da imagem */}
      <div className="flex min-h-[50px] flex-wrap items-center justify-between gap-2 border-t border-stage-line pt-2">
        {isGrid ? (
          <span className="text-xs font-semibold tracking-[0.06em] text-stage-soft uppercase">{t.home.gridClean}</span>
        ) : (
          <div role="group" aria-label={t.home.stagePalettes} className="flex flex-wrap items-center">
            {STAGE_PALETTES.map((id) => {
              const p = paletteById(id);
              return (
                <Swatch
                  key={id}
                  compact
                  label={t.recap.palettes[id] ?? p.name}
                  active={paletteId === id}
                  onClick={() => setPaletteId(id)}
                  background={`linear-gradient(135deg, ${p.room} 50%, ${p.accent} 50%)`}
                />
              );
            })}
            <Swatch
              compact
              label={t.recap.coverColor}
              active={paletteId === COVER_PALETTE_ID}
              onClick={() => setPaletteId(COVER_PALETTE_ID)}
              background={
                coverPalette
                  ? `linear-gradient(135deg, ${coverPalette.room} 50%, ${coverPalette.accent} 50%)`
                  : "conic-gradient(#e8a13a, #ff7aa2, #c59bff, #6fc3ff, #e8a13a)"
              }
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {isTurntable && (
            <button
              type="button"
              role="switch"
              aria-checked={coloredVinyl}
              onClick={() => setColoredVinyl((v) => !v)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition duration-200 ease-smooth active:scale-[0.98] " +
                (coloredVinyl
                  ? "border-amber/60 bg-amber/15 text-stage-ink"
                  : "border-stage-line text-stage-soft hover:border-stage-faint hover:text-stage-ink")
              }
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full ring-1 ring-white/25 transition-colors duration-200 ease-smooth"
                style={{ backgroundColor: coloredVinyl && vinylColor ? vinylColor : "var(--color-vinyl)" }}
              />
              <span>{t.recap.coloredVinyl}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stage-line px-2.5 py-1.5 text-xs font-semibold text-stage-ink transition duration-200 ease-smooth hover:border-stage-faint active:scale-[0.98]"
          >
            <span aria-hidden className="inline-block transition-transform duration-300 ease-smooth group-hover:rotate-90">
              ↻
            </span>
            <span>{t.home.swapDisc}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
