"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { thumbUrl } from "@/lib/grid/layout";
import type { TrendingCover } from "@/lib/trending";
import { HomePosterPreview } from "./HomePosterPreview";
import { Marquee } from "./Marquee";
import { NoLastfmGuide } from "./NoLastfmGuide";
import { ShowcaseShelf } from "./ShowcaseShelf";
import { UsernameForm } from "./UsernameForm";

type Props = {
  covers: TrendingCover[];
  caption: string;
};

/**
 * Experiência completa da página inicial ("Loja de discos viva", docs/MARCA.md):
 * 1. Primeira dobra mobile-first: título + campo de username + janela viva de discos girando;
 * 2. Faixa terracota com os discos redondos clicáveis da vitrine;
 * 3. Palco escuro com os formatos reais desenhados pelo mesmo código do canvas;
 * 4. Três cartões quentes resumindo como o site funciona.
 */
export function HomeHero({ covers, caption }: Props) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const count = covers.length;
  const hasCovers = count > 0;
  const lead = hasCovers ? covers[activeIndex % count] : null;
  const second = count > 1 ? covers[(activeIndex + 1) % count] : lead;
  const third = count > 2 ? covers[(activeIndex + 2) % count] : second;

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
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <NoLastfmGuide />
                <span className="font-mono text-xs text-ink-faint">{t.home.freeNoLogin}</span>
              </div>
            </div>
          </div>

          {/* Janela viva com capas em leque + disco girando logo na primeira dobra */}
          <div className="relative overflow-hidden rounded-[26px] border border-stage-line bg-stage p-5 text-stage-ink shadow-xl">
            {lead ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 text-xs">
                  <p className="flex min-w-0 items-center gap-2 font-semibold">
                    <span aria-hidden className="size-2 shrink-0 rounded-full bg-amber" />
                    <span key={lead.imageUrl} className="truncate motion-safe:animate-disc-in">
                      {lead.name} · {lead.artist}
                    </span>
                  </p>
                  <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs text-stage-soft">
                    33⅓ RPM
                  </span>
                </div>

                <div aria-hidden className="relative mx-auto h-44 w-[264px] sm:h-52 sm:w-[324px]">
                  {third && (
                    <div className="absolute left-0 top-5 size-28 -rotate-12 overflow-hidden rounded-xl border border-white/15 opacity-75 shadow-xl transition-all duration-300 ease-smooth sm:top-6 sm:size-32">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(third.imageUrl)} alt="" width={174} height={174} decoding="async" className="size-full object-cover" />
                    </div>
                  )}
                  {second && (
                    <div className="absolute left-4 top-3 size-32 -rotate-6 overflow-hidden rounded-xl border border-white/20 opacity-90 shadow-xl transition-all duration-300 ease-smooth sm:left-6 sm:top-3.5 sm:size-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(second.imageUrl)} alt="" width={174} height={174} decoding="async" className="size-full object-cover" />
                    </div>
                  )}

                  {/* Disco de vinil saindo pela direita com a capa principal como selo */}
                  <div
                    className="absolute right-0 top-2 size-36 rounded-full border border-white/20 shadow-2xl motion-safe:animate-spin-slow sm:size-44"
                    style={{
                      background:
                        "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)",
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 24deg, transparent 0 8%, rgba(255,243,214,0.2) 13%, transparent 19%, transparent 58%, rgba(255,243,214,0.12) 63%, transparent 69%)",
                      }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(lead.imageUrl)}
                      alt=""
                      width={120}
                      height={120}
                      decoding="async"
                      className="absolute inset-[30%] size-[40%] rounded-full object-cover ring-2 ring-amber"
                    />
                    <span className="absolute inset-[46%] rounded-full bg-stage" />
                  </div>

                  {/* Capa principal na frente */}
                  <div className="absolute left-9 top-2 z-10 size-36 overflow-hidden rounded-xl border border-white/20 bg-stage-card shadow-2xl shadow-black/60 transition-all duration-300 ease-smooth sm:left-11 sm:size-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(lead.imageUrl)}
                      alt=""
                      width={174}
                      height={174}
                      loading="eager"
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

      {/* FAIXA TERRACOTA DE DISCOS REDONDOS CLICÁVEIS */}
      <ShowcaseShelf covers={covers} caption={caption} activeIndex={activeIndex} onSelect={setActiveIndex} />

      {/* PALCO ESCURO COM OS PÔSTERES REAIS INTACTOS */}
      {hasCovers && <HomePosterPreview covers={covers} offset={activeIndex} onNext={nextDisc} />}

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
