"use client";

import { useI18n } from "@/i18n/client";
import { thumbUrl } from "@/lib/grid/layout";
import type { TrendingCover } from "@/lib/trending";
import { Marquee } from "./Marquee";

/** A faixa tem até 6 discos (como a vitrine em src/data/vitrine.json). */
const SHELF_SIZE = 6;

type Props = {
  covers: TrendingCover[];
  /** Legenda da vitrine (vitrine.json) ou a dos álbuns em alta. */
  caption: string;
  /** Índice do disco atualmente em destaque no hero e no palco. */
  activeIndex: number;
  /** Troca o disco em destaque ao tocar/clicar. */
  onSelect: (index: number) => void;
};

/**
 * Faixa terracota da página inicial com os discos da vitrine em formato redondo, clicáveis.
 * Tocar em um disco coloca o álbum como destaque no topo e no palco do pôster abaixo.
 * O disco ativo gira bem devagar; os demais retomam o giro suave ao passar o mouse sem dar tranco.
 */
export function ShowcaseShelf({ covers, caption, activeIndex, onSelect }: Props) {
  const { t } = useI18n();
  const items = covers.slice(0, SHELF_SIZE);

  return (
    <section aria-labelledby="vitrine-titulo" className="bg-terra text-terra-ink">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="vitrine-titulo" className="text-lg font-extrabold tracking-tight sm:text-xl">
              {caption}
            </h2>
            {items.length >= 4 && (
              <p className="text-xs text-terra-ink/90">{t.home.discStripHint}</p>
            )}
          </div>
          {items.length >= 4 && (
            <span className="rounded-full bg-black/20 px-3 py-1 font-mono text-xs font-medium tracking-[0.08em] uppercase tabular-nums">
              {t.home.discCount(items.length)}
            </span>
          )}
        </div>

        {items.length >= 4 ? (
          <div className="no-scrollbar -mx-2 flex gap-3.5 overflow-x-auto px-2 py-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {items.map((cover, i) => {
              const active = i === activeIndex % items.length;
              return (
                <button
                  key={cover.imageUrl}
                  type="button"
                  aria-pressed={active}
                  aria-label={t.home.shelfItem(cover.name, cover.artist)}
                  onClick={() => onSelect(i)}
                  className="group flex w-[88px] shrink-0 flex-col items-center gap-2 text-center transition-transform duration-200 ease-smooth active:scale-[0.98] sm:w-auto"
                >
                  <span
                    className={
                      "relative block size-[82px] rounded-full p-[3px] transition-[transform,opacity,box-shadow] duration-300 ease-smooth sm:size-[96px] " +
                      (active
                        ? "scale-105 ring-2 ring-terra-ink ring-offset-2 ring-offset-terra group-hover:-translate-y-0.5"
                        : "opacity-90 group-hover:-translate-y-1 group-hover:scale-[1.04] group-hover:opacity-100")
                    }
                  >
                    <span
                      aria-hidden
                      className={
                        "relative block size-full overflow-hidden rounded-full shadow-lg shadow-black/45 ring-1 ring-white/10 motion-safe:animate-spin-slow " +
                        (active
                          ? "[animation-play-state:running]"
                          : "[animation-play-state:paused] group-hover:[animation-play-state:running]")
                      }
                      style={{
                        background:
                          "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)",
                      }}
                    >
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(from 24deg, transparent 0 8%, rgba(255,243,214,0.22) 13%, transparent 19%, transparent 58%, rgba(255,243,214,0.14) 63%, transparent 69%)",
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbUrl(cover.imageUrl)}
                        alt=""
                        width={174}
                        height={174}
                        loading="eager"
                        decoding="async"
                        className="absolute inset-[29%] size-[42%] rounded-full object-cover ring-1 ring-black/60"
                      />
                      <span className="absolute inset-[46%] rounded-full bg-vinyl ring-1 ring-white/20" />
                    </span>
                  </span>
                  <span className="w-full">
                    <span className="block truncate text-xs font-extrabold leading-tight text-terra-ink">
                      {cover.artist}
                    </span>
                    <span className="block truncate text-xs text-terra-ink/85">{cover.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div aria-hidden className="flex flex-col gap-2 py-2">
            <Marquee size={68} seconds={85} />
          </div>
        )}
      </div>
    </section>
  );
}
