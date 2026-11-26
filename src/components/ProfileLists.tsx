"use client";

import { useRef, useState, type ReactNode } from "react";
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

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const panels: Record<ListKey, ReactNode> = { artists, tracks, albums, genres };

  return (
    <section aria-labelledby="listas-titulo" className="flex flex-col gap-3.5 motion-safe:animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="listas-titulo" className="text-2xl font-extrabold sm:text-[1.75rem] tracking-tight text-ink">
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
        {LIST_KEYS.map((key, index) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`list-tab-${key}`}
              aria-controls={`list-panel-${key}`}
              tabIndex={on ? 0 : -1}
              ref={(button) => { buttons.current[index] = button; }}
              onKeyDown={(event) => {
                let next = index;
                switch (event.key) {
                  case "ArrowRight": next = (index + 1) % LIST_KEYS.length; break;
                  case "ArrowLeft": next = (index + LIST_KEYS.length - 1) % LIST_KEYS.length; break;
                  case "Home": next = 0; break;
                  case "End": next = LIST_KEYS.length - 1; break;
                  default: return;
                }
                event.preventDefault();
                setActive(LIST_KEYS[next]);
                buttons.current[next]?.focus();
              }}
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
              id={`list-panel-${key}`}
              role="tabpanel"
              aria-label={t.lists[key]}
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
