"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { TrendLegend } from "./RankTrend";

const LIST_KEYS = ["artists", "tracks", "albums", "genres"] as const;
type ListKey = (typeof LIST_KEYS)[number];

type Props = {
  artists: ReactNode;
  tracks: ReactNode;
  albums: ReactNode;
  genres: ReactNode;
  /** Nome do período anterior comparado (ex.: "30 dias anteriores", "setembro de 2026"). */
  compareLabel?: string;
  /** Só mostra a legenda quando houver ao menos uma lista comparada com dados reais. */
  hasTrends?: Promise<boolean> | boolean;
};

/**
 * Listas do perfil ("O que mais tocou"):
 * - no celular (< md), pílulas no topo permitem alternar entre Artistas, Músicas, Álbuns
 *   e Gêneros sem rolagem infinita;
 * - no computador (md+), todas aparecem num grid 2×2 largo para os nomes respirarem.
 */
export function ProfileLists({ artists, tracks, albums, genres, compareLabel, hasTrends }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<ListKey>("artists");

  const panels: Record<ListKey, ReactNode> = { artists, tracks, albums, genres };

  return (
    <section aria-labelledby="listas-titulo" className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="listas-titulo" className="text-xl font-extrabold tracking-tight text-ink">
            {t.profile.topHeading}
          </h2>
          <p className="font-mono text-xs text-ink-faint">{t.profile.topHint}</p>
        </div>
        <TrendLegend label={compareLabel} ready={hasTrends} />
      </div>

      {/* Filtro em pílulas só no celular */}
      <div
        role="tablist"
        aria-label={t.profile.listsTabsLabel}
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden"
      >
        {LIST_KEYS.map((key) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(key)}
              className={
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition duration-200 ease-smooth active:scale-[0.98] " +
                (on
                  ? key === "genres"
                    ? "bg-terra text-terra-ink"
                    : "bg-cta text-cta-ink"
                  : "border border-line bg-card text-soft hover:text-ink")
              }
            >
              {t.lists[key]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LIST_KEYS.map((key) => (
          <div key={key} className={active === key ? "min-w-0 block" : "min-w-0 hidden md:block"}>
            {panels[key]}
          </div>
        ))}
      </div>
    </section>
  );
}
