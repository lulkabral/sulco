"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { loadImage } from "@/lib/canvas/image";
import { coverUrl } from "@/lib/grid/layout";
import type { Rgb } from "@/lib/recap/palettes";
import type { TrendingCover } from "@/lib/trending";
import { SHELF_MAX } from "@/lib/showcase";
import { assignVinylFinishes, sampleCoverRgb } from "@/lib/vinyl-color";
import { HomePosterPreview } from "./HomePosterPreview";
import { Marquee } from "./Marquee";
import { NoLastfmGuide } from "./NoLastfmGuide";
import { ShowcaseShelf } from "./ShowcaseShelf";
import { UsernameForm } from "./UsernameForm";

type Props = {
  covers: TrendingCover[];
  caption: string;
};

/** Quantas capas da vitrine amostram cor para o vinil colorido (cobre os 6 discos + eventual reserva). */
const VINYL_SAMPLE_LIMIT = 9;

/**
 * Experiência completa da página inicial ("Loja de discos viva", docs/MARCA.md):
 * 1. Primeira dobra mobile-first: título + campo de username + palco real ao vivo (recap e grade
 *    desenhados pelo mesmo canvas baixado no perfil, com a imagem como protagonista);
 * 2. Faixa terracota com as capas e discos coloridos da vitrine (sincronizados com o palco).
 */
export function HomeHero({ covers, caption }: Props) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [images, setImages] = useState<(HTMLImageElement | null)[]>(() => covers.map(() => null));
  const [coverRgbs, setCoverRgbs] = useState<(Rgb | null)[]>(() =>
    covers.slice(0, VINYL_SAMPLE_LIMIT).map(() => null),
  );
  // Só os 6 primeiros viram discos; os outros (até 9) só completam a grade do palco.
  const count = Math.min(covers.length, SHELF_MAX);
  const hasCovers = count > 0;

  // Carrega cada capa 300×300 com CORS uma única vez: alimenta o canvas do palco,
  // a paleta "Cor da capa" e a cor de vinil contrastante dos discos da vitrine.
  useEffect(() => {
    let cancelled = false;
    covers.forEach((cover, i) => {
      loadImage(coverUrl(cover.imageUrl, 300), 8_000).then((img) => {
        if (cancelled || !img) return;
        setImages((prev) => prev.map((x, j) => (j === i ? img : x)));
        if (i < VINYL_SAMPLE_LIMIT) {
          const rgb = sampleCoverRgb(img);
          if (rgb) setCoverRgbs((prev) => prev.map((c, j) => (j === i ? rgb : c)));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [covers]);

  const vinylColors = useMemo(
    () =>
      assignVinylFinishes(
        covers
          .slice(0, VINYL_SAMPLE_LIMIT)
          .map((c, i) => ({ color: coverRgbs[i] ?? null, seed: `${c.artist}-${c.name}` })),
      ).map((finish) => finish?.base ?? null),
    [covers, coverRgbs],
  );
  const activeVinylColor =
    hasCovers && vinylColors.length > 0 ? (vinylColors[activeIndex % vinylColors.length] ?? null) : null;

  function nextDisc() {
    if (count > 0) setActiveIndex((i) => (i + 1) % count);
  }

  return (
    <>
      {/* HERO UNIFICADO: título + formulário + palco real ao vivo já na 1ª tela */}
      <section className="mx-auto w-full max-w-[88rem] px-4 pb-6 pt-4 sm:px-6 md:py-6 lg:px-10">
        <div className="mx-auto grid max-w-[69rem] grid-cols-1 items-center gap-5 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="flex flex-col gap-3.5 sm:gap-5">
            <h1 className="text-[clamp(2.35rem,1.25rem+5vw,5rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-ink">
              <span className="block">{t.home.titleLine1}</span>
              <span className="block">
                {t.home.titleLine2}
                <span className="text-terra-text">{t.home.titleEnd}</span>
              </span>
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-soft sm:text-base lg:text-lg">{t.home.intro}</p>

            <div className="mt-0.5 flex max-w-lg flex-col gap-2">
              <UsernameForm />
              <div className="px-1">
                <NoLastfmGuide />
              </div>
            </div>
          </div>

          <div className="w-full lg:max-w-[32rem] lg:justify-self-end">
            {hasCovers ? (
              <HomePosterPreview
                covers={covers}
                images={images}
                offset={activeIndex}
                vinylColor={activeVinylColor}
                onNext={nextDisc}
              />
            ) : (
              <div className="relative overflow-hidden rounded-[26px] border border-stage-line bg-stage p-5 text-stage-ink shadow-xl">
                <div aria-hidden className="flex flex-col gap-3 py-6">
                  <Marquee size={72} seconds={85} />
                  <Marquee size={72} seconds={105} reverse offset={5} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAIXA TERRACOTA DE CAPAS E DISCOS COLORIDOS CLICÁVEIS */}
      <ShowcaseShelf
        covers={covers}
        caption={caption}
        activeIndex={activeIndex}
        vinylColors={vinylColors}
        onSelect={setActiveIndex}
      />
    </>
  );
}
