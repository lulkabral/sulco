"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import type { TrendingCover } from "@/lib/trending";
import { HomePosterPreview } from "./HomePosterPreview";
import { NoLastfmGuide } from "./NoLastfmGuide";
import { UsernameForm } from "./UsernameForm";

/**
 * Hero da página inicial em duas colunas com divisória de 1px: à esquerda, a ação
 * (título, campo e ficha técnica); à direita, o palco com os formatos reais. No celular,
 * a ação vem primeiro e o palco logo abaixo. "Ver outro exemplo" gira a ordem das capas.
 */
export function HomeHero({ covers }: { covers: TrendingCover[] }) {
  const { t } = useI18n();
  const [offset, setOffset] = useState(0);
  const hasStage = covers.length > 0;

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] border-b border-rule md:grid-cols-2 md:divide-x md:divide-rule">
      <div className="flex flex-col">
        <div className="flex flex-1 flex-col gap-7 px-4 py-10 sm:px-8 md:py-14">
          {/* Linha técnica com o "LED" âmbar. */}
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.16em] text-soft uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-amber" />
            {t.home.eyebrow}
          </p>

          <h1 className="text-[clamp(2.9rem,13.5vw,5.25rem)] leading-[0.92] font-extrabold tracking-[-0.045em] md:text-[clamp(3rem,5.2vw,4.75rem)]">
            <span className="block text-ink">{t.home.titleLine1}</span>
            <span className="block text-soft">
              {t.home.titleLine2}
              <span className="-ml-[0.06em] text-amber">{t.home.titleEnd}</span>
            </span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-soft">{t.home.intro}</p>

          <div className="flex max-w-lg flex-col gap-4">
            <UsernameForm />
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              {hasStage && (
                <button
                  type="button"
                  onClick={() => setOffset((o) => (o + 1) % covers.length)}
                  className="font-mono text-xs tracking-[0.14em] text-soft uppercase underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  ↻ {t.home.tryExample}
                </button>
              )}
              <NoLastfmGuide />
            </div>
          </div>
        </div>

        {/* Ficha técnica: números em mono, sem ícones. */}
        <dl className="grid grid-cols-3 divide-x divide-rule border-t border-rule">
          {t.home.specs.map((spec) => (
            <div key={spec.label} className="flex flex-col gap-1 px-4 py-4 sm:px-8">
              <dt className="order-2 text-xs leading-snug text-ink-faint">{spec.label}</dt>
              <dd className="order-1 font-mono text-xl font-medium text-ink tabular-nums">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {hasStage && (
        <div className="border-t border-rule md:border-t-0">
          <HomePosterPreview covers={covers} offset={offset} />
        </div>
      )}
    </section>
  );
}
