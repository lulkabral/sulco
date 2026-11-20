"use client";

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

  return (
    <section aria-labelledby="vitrine-titulo" className="bg-terra text-terra-ink">
      <div className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 sm:py-7 lg:px-10">
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
          <div className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 py-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:py-2 lg:grid-cols-6 lg:gap-3 xl:gap-4">
            {items.map((cover, i) => {
              const active = i === activeIndex % items.length;
              const discColor = vinylColors[i] ?? null;
              const coverSrc = coverUrl(cover.imageUrl, 300);
              return (
                <button
                  key={cover.imageUrl}
                  type="button"
                  aria-pressed={active}
                  aria-label={t.home.shelfItem(cover.name, cover.artist)}
                  onClick={() => onSelect(i)}
                  className="group flex w-[134px] shrink-0 flex-col items-center gap-2.5 text-center transition-transform duration-200 ease-smooth active:scale-[0.98] sm:w-auto"
                >
                  {/* Conjunto LP: capa quadrada na frente + vinil colorido girando metade para fora */}
                  <span
                    aria-hidden
                    className={
                      "relative block h-[86px] w-[128px] transition-transform duration-300 ease-smooth sm:h-[100px] sm:w-[148px] lg:h-[94px] lg:w-[140px] xl:h-[116px] xl:w-[172px] " +
                      (active ? "-translate-y-0.5" : "group-hover:-translate-y-0.5")
                    }
                  >
                    {/* Camada do deslize (separada do giro para o translate-x não brigar com o rotate) */}
                    <span
                      className={
                        "absolute left-[40px] top-[3px] block size-[80px] transition-transform duration-300 ease-smooth sm:left-[48px] sm:top-[4px] sm:size-[92px] lg:left-[46px] lg:size-[86px] xl:left-[56px] xl:size-[108px] " +
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
                        "relative z-10 block size-[86px] overflow-hidden bg-stage-card shadow-[4px_6px_14px_rgba(0,0,0,0.45)] transition-[box-shadow] duration-300 ease-smooth sm:size-[100px] lg:size-[94px] xl:size-[116px] " +
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

                  <span className="w-full max-w-[148px] xl:max-w-[172px]">
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
