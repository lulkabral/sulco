"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";

const LIST_KEYS = ["artists", "tracks", "albums", "genres"] as const;
type ListKey = (typeof LIST_KEYS)[number];

type Props = {
  artists: ReactNode;
  tracks: ReactNode;
  albums: ReactNode;
  genres: ReactNode;
  /** Ficha técnica do período ("Raio-X"): no computador fecha o espaço abaixo de Gêneros; no celular fica logo abaixo da aba ativa. */
  highlights?: ReactNode;
};

/**
 * Listas do perfil ("O que mais tocou"):
 * - no celular (< md), pílulas no topo alternam entre Artistas, Músicas, Álbuns e Gêneros
 *   sem rolagem infinita, e o Raio-X aparece logo abaixo;
 * - no computador (md+), Artistas e Músicas abrem a 1ª linha; na 2ª linha, Álbuns ocupa a
 *   coluna esquerda enquanto Gêneros + Raio-X se empilham na direita sem buraco vazio.
 */
export function ProfileLists({ artists, tracks, albums, genres, highlights }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<ListKey>("artists");

  const panels: Record<ListKey, ReactNode> = { artists, tracks, albums, genres };

  return (
    <section aria-labelledby="listas-titulo" className="flex flex-col gap-3.5 motion-safe:animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="listas-titulo" className="text-xl font-extrabold tracking-tight text-ink">
          {t.profile.topHeading}
        </h2>
        <p className="text-xs text-ink-faint">{t.profile.topHint}</p>
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
                "shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition duration-200 ease-smooth active:scale-[0.98] " +
                (on
                  ? "bg-cta text-cta-ink"
                  : "border border-line bg-card text-soft hover:text-ink")
              }
            >
              {t.lists[key]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:grid-rows-[auto_auto_1fr]">
        {LIST_KEYS.map((key) => {
          const desktopPlacement = key === "albums" && highlights ? "md:row-span-2" : "";
          return (
            <div
              key={key}
              className={`min-w-0 ${desktopPlacement} ${active === key ? "block" : "hidden md:block"}`}
            >
              {panels[key]}
            </div>
          );
        })}
        {highlights && <div className="min-w-0">{highlights}</div>}
      </div>
    </section>
  );
}
