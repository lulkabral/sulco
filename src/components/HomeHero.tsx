"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { loadImage } from "@/lib/canvas/image";
import { coverUrl } from "@/lib/grid/layout";
import type { Rgb } from "@/lib/recap/palettes";
import type { TrendingCover } from "@/lib/trending";
import { assignVinylFinishes, sampleCoverRgb, VINYL_GROOVES, VINYL_SHEEN } from "@/lib/vinyl-color";
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
 * 1. Primeira dobra mobile-first: título + campo de username + janela viva de discos coloridos girando;
 * 2. Faixa terracota com os discos redondos clicáveis da vitrine (cada um contrastando com sua capa);
 * 3. Palco escuro com os formatos reais desenhados pelo mesmo código do canvas;
 * 4. Três cartões quentes resumindo como o site funciona.
 */
export function HomeHero({ covers, caption }: Props) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [coverRgbs, setCoverRgbs] = useState<(Rgb | null)[]>(() =>
    covers.slice(0, VINYL_SAMPLE_LIMIT).map(() => null),
  );
  const count = covers.length;
  const hasCovers = count > 0;
  const lead = hasCovers ? covers[activeIndex % count] : null;
  const second = count > 1 ? covers[(activeIndex + 1) % count] : lead;
  const third = count > 2 ? covers[(activeIndex + 2) % count] : second;

  // Lê o tom predominante das capas 300x300 (mesmo endereço já usado no topo, na vitrine e
  // no palco com CORS: baixa uma vez só e fica nítido em telas Retina).
  useEffect(() => {
    let cancelled = false;
    covers.slice(0, VINYL_SAMPLE_LIMIT).forEach((cover, i) => {
      loadImage(coverUrl(cover.imageUrl, 300), 8_000).then((img) => {
        if (cancelled || !img) return;
        const rgb = sampleCoverRgb(img);
        if (!rgb) return;
        setCoverRgbs((prev) => prev.map((c, j) => (j === i ? rgb : c)));
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
      {/* HERO: título + ação + janela viva de discos (tudo visível na 1ª tela do celular) */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-5 sm:px-6 md:py-10">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="flex flex-col gap-4 sm:gap-5">
            <h1 className="text-[clamp(2.5rem,11vw,4.35rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-ink">
              <span className="block">{t.home.titleLine1}</span>
              <span className="block">
                {t.home.titleLine2}
                <span className="text-terra-text">{t.home.titleEnd}</span>
              </span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-soft sm:text-base">{t.home.intro}</p>

            <div className="mt-0.5 flex max-w-md flex-col gap-2.5">
              <UsernameForm />
              <div className="px-1">
                <NoLastfmGuide />
              </div>
            </div>
          </div>

          {/* Janela viva com capas em leque + disco colorido girando logo na primeira dobra */}
          <div className="relative overflow-hidden rounded-[26px] border border-stage-line bg-stage p-5 text-stage-ink shadow-xl">
            {lead ? (
              <>
                <div className="mb-4 flex items-center gap-3 text-xs">
                  <p className="flex min-w-0 items-center gap-2 font-semibold">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full transition-colors duration-300 ease-smooth"
                      style={{ backgroundColor: activeVinylColor ?? "var(--color-amber)" }}
                    />
                    <span key={lead.imageUrl} className="truncate motion-safe:animate-disc-in">
                      {lead.name} · {lead.artist}
                    </span>
                  </p>
                </div>

                <div aria-hidden className="relative mx-auto h-44 w-[264px] sm:h-52 sm:w-[324px]">
                  {third && (
                    <div className="absolute left-0 top-5 size-28 -rotate-12 overflow-hidden opacity-75 shadow-xl shadow-black/50 transition-all duration-300 ease-smooth sm:top-6 sm:size-32">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverUrl(third.imageUrl, 300)} alt="" width={300} height={300} crossOrigin="anonymous" decoding="async" className="size-full object-cover" />
                    </div>
                  )}
                  {second && (
                    <div className="absolute left-4 top-3 size-32 -rotate-6 overflow-hidden opacity-90 shadow-xl shadow-black/60 transition-all duration-300 ease-smooth sm:left-6 sm:top-3.5 sm:size-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverUrl(second.imageUrl, 300)} alt="" width={300} height={300} crossOrigin="anonymous" decoding="async" className="size-full object-cover" />
                    </div>
                  )}

                  {/* Disco de vinil colorido saindo pela direita com a capa principal como selo */}
                  <div
                    className="absolute right-0 top-2 size-36 overflow-hidden rounded-full shadow-2xl transition-[background-color] duration-300 ease-smooth motion-safe:animate-spin-slow sm:size-44"
                    style={{
                      backgroundColor: activeVinylColor ?? "var(--color-vinyl)",
                      backgroundImage: VINYL_GROOVES,
                      boxShadow:
                        "inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 14px rgba(0, 0, 0, 0.14), 0 18px 36px rgba(0, 0, 0, 0.55)",
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: VINYL_SHEEN }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl(lead.imageUrl, 300)}
                      alt=""
                      width={300}
                      height={300}
                      crossOrigin="anonymous"
                      decoding="async"
                      className="absolute inset-[30%] size-[40%] rounded-full object-cover ring-1 ring-black/20"
                    />
                    <span className="absolute inset-[46%] rounded-full bg-stage" />
                  </div>

                  {/* Capa principal quadrada na frente (sem cantos arredondados, como capa de LP) */}
                  <div className="absolute left-9 top-2 z-10 size-36 overflow-hidden bg-stage-card shadow-2xl shadow-black/70 ring-1 ring-white/10 transition-all duration-300 ease-smooth sm:left-11 sm:size-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl(lead.imageUrl, 300)}
                      alt=""
                      width={300}
                      height={300}
                      loading="eager"
                      crossOrigin="anonymous"
                      decoding="async"
                      fetchPriority="high"
                      className="size-full object-cover"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-xs">
                  <span className="text-stage-soft">{t.home.tapDiscsHint}</span>
                  <a
                    href="#palco"
                    className="shrink-0 font-bold text-amber underline underline-offset-4 transition-colors duration-200 ease-smooth hover:text-amber-hover"
                  >
                    {t.home.seePosters} ↓
                  </a>
                </div>
              </>
            ) : (
              <div aria-hidden className="flex flex-col gap-3 py-6">
                <Marquee size={72} seconds={85} />
                <Marquee size={72} seconds={105} reverse offset={5} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAIXA TERRACOTA DE DISCOS COLORIDOS CLICÁVEIS */}
      <ShowcaseShelf
        covers={covers}
        caption={caption}
        activeIndex={activeIndex}
        vinylColors={vinylColors}
        onSelect={setActiveIndex}
      />

      {/* PALCO ESCURO COM OS PÔSTERES REAIS */}
      {hasCovers && (
        <HomePosterPreview
          covers={covers}
          offset={activeIndex}
          vinylColor={activeVinylColor}
          onNext={nextDisc}
        />
      )}

      {/* 3 BLOCOS ARREDONDADOS QUENTES */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {t.home.highlights.map((card, i) => {
            const tone =
              i === 0
                ? "bg-terra text-terra-ink"
                : i === 1
                  ? "border border-line bg-card-2 text-ink"
                  : "border border-stage-line bg-stage text-stage-ink";
            const eyebrowTone =
              i === 0 ? "text-terra-ink/85" : i === 1 ? "text-terra-text" : "text-amber";
            const bodyTone =
              i === 0 ? "text-terra-ink/90" : i === 1 ? "text-soft" : "text-stage-soft";

            return (
              <article key={card.eyebrow} className={`flex flex-col justify-between gap-4 rounded-[24px] p-5 ${tone}`}>
                <p className={`font-mono text-xs font-medium tracking-[0.12em] uppercase ${eyebrowTone}`}>
                  {card.eyebrow}
                </p>
                <div>
                  <h2 className="text-lg font-extrabold leading-tight tracking-tight">{card.title}</h2>
                  <p className={`mt-1.5 text-sm leading-relaxed ${bodyTone}`}>{card.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
