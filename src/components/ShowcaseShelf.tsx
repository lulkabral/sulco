"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { coverUrl } from "@/lib/grid/layout";
import type { TrendingCover } from "@/lib/trending";
import { VINYL_GROOVES, VINYL_SHEEN } from "@/lib/vinyl-color";
import { Marquee } from "./Marquee";
import { SHELF_MAX } from "@/lib/showcase";

/** A faixa tem até 6 discos (os 6 primeiros da vitrine em src/data/vitrine.json). */
const SHELF_SIZE = SHELF_MAX;

type Props = {
  covers: TrendingCover[];
  /** Legenda da vitrine (vitrine.json) ou a dos álbuns em alta. */
  caption: string;
  /** Índice do disco atualmente em destaque no hero e no palco. */
  activeIndex: number;
  /** Cor de vinil contrastante calculada para cada capa (mesma usada no topo). */
  vinylColors: (string | null)[];
  /** Troca o disco em destaque ao tocar/clicar. */
  onSelect: (index: number) => void;
};

/**
 * Faixa terracota da página inicial com os discos da vitrine, clicáveis.
 * Cada item mostra a capa quadrada do álbum na frente e o vinil colorido contrastante
 * saindo metade para fora à direita. O disco ativo desliza um pouco mais para fora e
 * gira calmo; os demais deslizam e retomam o giro suave ao passar o mouse.
 */
export function ShowcaseShelf({ covers, caption, activeIndex, vinylColors, onSelect }: Props) {
  const { t } = useI18n();
  const items = covers.slice(0, SHELF_SIZE);

  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const hasRecords = items.length >= 4;

  useEffect(() => {
    const element = rail.current;
    if (!element) return;

    function updateEdges() {
      if (!element) return;
      setEdges({
        start: element.scrollLeft <= 1,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      });
    }

    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    element.addEventListener("scroll", updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", updateEdges);
    };
  }, [hasRecords]);

  useEffect(() => {
    const element = rail.current;
    const record = element?.children[activeIndex];
    if (!element || !(record instanceof HTMLElement)) return;

    const right = record.offsetLeft + record.offsetWidth;
    if (record.offsetLeft < element.scrollLeft) {
      element.scrollTo({ left: record.offsetLeft });
    } else if (right > element.scrollLeft + element.clientWidth) {
      element.scrollTo({ left: right - element.clientWidth });
    }
  }, [activeIndex]);

  function browse(direction: -1 | 1) {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth });
  }

  return (
    <section aria-labelledby="vitrine-titulo" className="mt-1 rounded-xl bg-terra text-terra-ink">
      <div className="px-3.5 pb-2 pt-3.5 sm:px-4 lg:pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="vitrine-titulo" className="text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
            {caption}
          </h2>
          {hasRecords && (
            <div className="hidden shrink-0 gap-1 lg:flex">
              <button
                type="button"
                aria-label={t.home.previousRecords}
                aria-controls="vitrine-discos"
                disabled={edges.start}
                onClick={() => browse(-1)}
                className="grid size-9 place-items-center rounded-full border border-terra-ink/40 text-xl leading-none hover:bg-terra-ink/15 disabled:opacity-35"
              >
                <span aria-hidden>‹</span>
              </button>
              <button
                type="button"
                aria-label={t.home.nextRecords}
                aria-controls="vitrine-discos"
                disabled={edges.end}
                onClick={() => browse(1)}
                className="grid size-9 place-items-center rounded-full border border-terra-ink/40 text-xl leading-none hover:bg-terra-ink/15 disabled:opacity-35"
              >
                <span aria-hidden>›</span>
              </button>
            </div>
          )}
        </div>

        {hasRecords ? (
          <div
            id="vitrine-discos"
            ref={rail}
            className="no-scrollbar relative -mx-3.5 flex snap-x gap-3 overflow-x-auto px-3.5 pb-1 pt-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:snap-mandatory lg:gap-2 lg:px-0"
          >
            {items.map((cover, i) => {
              const active = i === activeIndex % items.length;
              const discColor = vinylColors[i] ?? null;
              const coverSrc = coverUrl(cover.imageUrl, 300);
              return (
                <div key={cover.imageUrl} className="w-[7.5rem] shrink-0 snap-start scroll-ml-3.5 lg:w-[calc((100%-1rem)/3)] lg:scroll-ml-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={t.home.shelfItem(cover.name, cover.artist)}
                    onClick={() => onSelect(i)}
                    className="group flex w-full flex-col items-start gap-2 rounded text-left focus-visible:-outline-offset-2 motion-safe:active:scale-[0.98] lg:px-1.5"
                  >
                    {/* Conjunto LP: capa quadrada na frente + vinil colorido girando metade para fora */}
                    <span
                      aria-hidden
                      className={
                        "relative block aspect-[1.38] w-full max-w-[8rem] transition-transform duration-300 ease-smooth " +
                        (active ? "-translate-y-0.5" : "group-hover:-translate-y-0.5")
                      }
                    >
                      {/* Camada do deslize (separada do giro para o translate-x não brigar com o rotate) */}
                      <span
                        className={
                          "absolute left-[29%] top-[4%] block aspect-square w-[65%] transition-transform duration-300 ease-smooth " +
                          (active ? "translate-x-1.5" : "group-hover:translate-x-1.5")
                        }
                      >
                        <span
                          className={
                            "relative block size-full overflow-hidden rounded-full shadow-lg shadow-black/40 transition-[background-color] duration-300 ease-smooth motion-safe:animate-spin-slow " +
                            (active
                              ? "[animation-play-state:running]"
                              : "[animation-play-state:paused] group-hover:[animation-play-state:running]")
                          }
                          style={{
                            backgroundColor: discColor ?? "var(--color-vinyl)",
                            backgroundImage: VINYL_GROOVES,
                            boxShadow:
                              "inset 0 0 0 1px rgba(255, 255, 255, 0.24), inset 0 0 10px rgba(0, 0, 0, 0.16), 0 8px 18px rgba(0, 0, 0, 0.35)",
                          }}
                        >
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{ background: VINYL_SHEEN }}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverSrc}
                            alt=""
                            width={300}
                            height={300}
                            loading="eager"
                            crossOrigin="anonymous"
                            decoding="async"
                            className="absolute inset-[30%] size-[40%] rounded-full object-cover ring-1 ring-black/30"
                          />
                          <span className="absolute inset-[46%] rounded-full bg-vinyl ring-1 ring-white/20" />
                        </span>
                      </span>

                      {/* Capa quadrada do álbum na frente (sem cantos arredondados, como capa real de LP) */}
                      <span
                        className={
                          "relative z-10 block aspect-square w-[72.5%] overflow-hidden bg-stage-card shadow-md shadow-black/40 transition-shadow duration-300 ease-smooth " +
                          (active
                            ? "ring-2 ring-terra-ink"
                            : "ring-1 ring-black/25 group-hover:ring-terra-ink/70")
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverSrc}
                          alt=""
                          width={300}
                          height={300}
                          loading="eager"
                          crossOrigin="anonymous"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      </span>
                    </span>

                    <span className="w-full">
                      <span className="block truncate text-xs font-extrabold leading-tight text-terra-ink">
                        {cover.artist}
                      </span>
                      <span className="block truncate text-xs text-terra-ink/85">{cover.name}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div aria-hidden className="flex flex-col gap-2 py-2">
            <Marquee size={68} seconds={85} />
          </div>
        )}
        {hasRecords && (
          <a href="#palco" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold underline underline-offset-4 lg:hidden">
            {t.home.viewPreview} <span aria-hidden>↓</span>
          </a>
        )}
      </div>
    </section>
  );
}
