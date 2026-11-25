"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { formatNumber, formatPlays } from "@/lib/format";
import type { CoverLookup } from "@/lib/artist-image";
import { VINYL_GROOVES, VINYL_SHEEN } from "@/lib/vinyl-color";
import { CardShortcut } from "./CardShortcut";
import { CoverThumb } from "./CoverThumb";
import { ListIcon, type ListIconName } from "./ListIcons";
import { RankTrend, useResolvedRankChanges, type RankChangesInput } from "./RankTrend";

export type TopListItem = {
  rank: number;
  name: string;
  /** Linha de baixo (artista), quando houver. */
  detail?: string;
  playcount: number;
  url: string;
  /** Imagem ao lado do nome. `null` mostra a inicial; ausente, não mostra nada. */
  image?: string | null;
  /** Sem imagem: álbum ou música cuja capa buscar. */
  lookup?: CoverLookup;
};

type Props = {
  title: string;
  icon: ListIconName;
  items: TopListItem[];
  /** Formato da miniatura: redonda (artistas) ou quadrada (músicas e álbuns). */
  shape?: "round" | "square";
  /**
   * Estilo editorial do cartão:
   * - "artists": #1 em destaque com aro fino de vinil + #02 em diante com bolinhas e preenchimento colorido
   * - "tracks": #1 em destaque com single + vinil espiando + #02 em diante como tracklist de encarte
   * - "default": lista padrão com preenchimento proporcional colorido
   */
  variant?: "artists" | "tracks" | "default";
  /** Quantos itens aparecem antes de tocar em "Ver até o #N". */
  initialLimit?: number;
  /** Variação de posição em relação ao período anterior (síncrona ou Promise). */
  changes?: RankChangesInput;
  /** Endereço para abrir a aba Tops já nesta categoria. */
  cardHref?: string;
};

/**
 * Lista numerada de um top, num cartão editorial.
 * A proporção em relação ao #1 aparece como preenchimento quente (`bg-bar-fill`) atrás de
 * cada linha, e os números de reproduções ficam em destaque na coluna direita.
 */
export function TopList({
  title,
  icon,
  items,
  shape = "square",
  variant = "default",
  initialLimit = 10,
  changes,
  cardHref,
}: Props) {
  const { lang, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const { changes: resolved, reserve } = useResolvedRankChanges(changes);

  const canExpand = items.length > initialLimit;
  const visible = expanded ? items : items.slice(0, initialLimit);
  const top = items[0]?.playcount || 1;
  const hasHero = (variant === "artists" || variant === "tracks") && visible.length > 0;
  const hero = hasHero ? visible[0] : null;
  const rest = hasHero ? visible.slice(1) : visible;

  const playUnitOf = (count: number) => {
    const numStr = formatNumber(count, lang);
    return formatPlays(count, lang).replace(numStr, "").trim();
  };

  return (
    <section
      aria-labelledby={`top-${title}`}
      className="min-w-0 rounded-[24px] border border-stage-line bg-stage p-5 text-stage-ink"
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-stage-line pb-3">
        <h3
          id={`top-${title}`}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber"
        >
          <ListIcon name={icon} />
          {title}
        </h3>
        {cardHref && items.length > 0 && <CardShortcut href={cardHref} listName={title} />}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-stage-soft">{t.lists.empty}</p>
      ) : (
        <>
          <ol className="flex flex-col gap-1.5">
            {hero && (
              <li
                key={`${hero.rank}-${hero.name}`}
                className="group relative mb-1.5 overflow-hidden rounded-2xl border border-stage-line bg-stage-card p-3.5"
              >
                <div className="flex items-center gap-3.5">
                  {variant === "artists" ? (
                    /* Foto do artista #1 dentro de um aro fino de vinil (eco do avatar do topo). */
                    <span
                      aria-hidden
                      className="relative flex size-[74px] shrink-0 items-center justify-center rounded-full shadow-sm"
                    >
                      <span
                        className="absolute inset-0 rounded-full motion-safe:group-hover:animate-spin-slow"
                        style={{
                          backgroundColor: "var(--color-vinyl)",
                          backgroundImage: VINYL_GROOVES,
                          boxShadow:
                            "inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{ background: VINYL_SHEEN }}
                        />
                      </span>
                      <span className="relative z-10 overflow-hidden rounded-full ring-2 ring-vinyl">
                        <CoverThumb
                          name={hero.name}
                          image={hero.image ?? null}
                          shape="round"
                          size="lg"
                          lookup={hero.lookup}
                        />
                      </span>
                    </span>
                  ) : (
                    /* Capa do single #1 com um vinil escuro espiando discretamente à direita. */
                    <span aria-hidden className="relative block h-16 w-[82px] shrink-0">
                      <span className="absolute left-[22px] top-[3px] block size-[58px] transition-transform duration-300 ease-smooth group-hover:translate-x-1">
                        <span
                          className="relative block size-full overflow-hidden rounded-full shadow-md shadow-black/35 motion-safe:group-hover:animate-spin-slow"
                          style={{
                            backgroundColor: "var(--color-vinyl)",
                            backgroundImage: VINYL_GROOVES,
                            boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.16)",
                          }}
                        >
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{ background: VINYL_SHEEN }}
                          />
                          <span className="absolute inset-[34%] rounded-full bg-terra ring-1 ring-black/40" />
                          <span className="absolute inset-[46%] rounded-full bg-vinyl" />
                        </span>
                      </span>
                      <span className="relative z-10 block size-16 overflow-hidden rounded-[4px] bg-stage shadow-[3px_4px_10px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
                        <CoverThumb
                          name={hero.name}
                          image={hero.image ?? null}
                          shape="square"
                          size="lg"
                          lookup={hero.lookup}
                        />
                      </span>
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-amber tabular-nums">
                        {String(hero.rank).padStart(2, "0")}
                      </span>
                      {reserve && <RankTrend change={resolved?.[0]} surface="stage" />}
                      <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-stage-faint">
                        {variant === "artists" ? t.lists.topArtistBadge : t.lists.noRepeat}
                      </span>
                    </div>
                    <a
                      href={hero.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-base font-extrabold leading-tight text-stage-ink transition-colors duration-200 ease-smooth hover:text-amber"
                    >
                      {hero.name}
                    </a>
                    {hero.detail && (
                      <p className="mt-0.5 truncate text-xs text-stage-soft">{hero.detail}</p>
                    )}
                    <p className="mt-1.5 flex items-baseline gap-1.5 sm:hidden">
                      <span className="text-sm font-bold leading-none text-stage-ink tabular-nums">
                        {formatNumber(hero.playcount, lang)}
                      </span>
                      <span className="text-xs text-stage-soft">
                        {playUnitOf(hero.playcount)}
                      </span>
                    </p>
                  </div>

                  {/* Contagem do #1 limpa à direita em telas >= sm, equilibrada com o título. */}
                  <div className="hidden shrink-0 text-right sm:block">
                    <span className="block text-xl font-extrabold leading-none text-stage-ink tabular-nums">
                      {formatNumber(hero.playcount, lang)}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-stage-soft">
                      {playUnitOf(hero.playcount)}
                    </span>
                  </div>
                </div>
              </li>
            )}

            {rest.map((item, idx) => {
              const i = hasHero ? idx + 1 : idx;
              const pct = Math.max(6, Math.round((item.playcount / top) * 100));

              if (variant === "tracks") {
                return (
                  <li
                    key={`${item.rank}-${item.name}`}
                    className="group relative overflow-hidden rounded-xl border border-stage-line/80 bg-stage-card/70"
                  >
                    {/* Preenchimento proporcional limpo (sem linha cortando a ponta). */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 origin-left bg-white/[0.085] transition-colors duration-200 group-hover:bg-white/[0.13] motion-safe:animate-grow"
                      style={{
                        width: `${pct}%`,
                        animationDelay: `${Math.min(i, 10) * 25}ms`,
                      }}
                    />
                    <div className="relative flex items-center gap-3 px-3.5 py-2.5">
                      {reserve ? (
                        <span className="flex w-9 shrink-0 items-center justify-end gap-1.5 text-[13px] font-semibold text-stage-soft tabular-nums">
                          <RankTrend change={resolved?.[i]} surface="stage" />
                          <span>{String(item.rank).padStart(2, "0")}</span>
                        </span>
                      ) : (
                        <span className="w-6 shrink-0 text-right text-[13px] font-semibold text-stage-soft tabular-nums">
                          {String(item.rank).padStart(2, "0")}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-bold text-stage-ink transition-colors duration-200 ease-smooth hover:text-amber"
                        >
                          {item.name}
                        </a>
                        {item.detail && (
                          <p className="truncate text-xs text-stage-soft">{item.detail}</p>
                        )}
                      </div>

                      <span
                        aria-label={formatPlays(item.playcount, lang)}
                        className="shrink-0 text-sm font-bold text-stage-ink tabular-nums"
                      >
                        {formatNumber(item.playcount, lang)}
                      </span>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={`${item.rank}-${item.name}`}
                  className="group relative overflow-hidden rounded-xl border border-stage-line/80 bg-stage-card/70"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 origin-left bg-white/[0.085] transition-colors duration-200 group-hover:bg-white/[0.13] motion-safe:animate-grow"
                    style={{
                      width: `${pct}%`,
                      animationDelay: `${Math.min(i, 10) * 25}ms`,
                    }}
                  />
                  <div
                    className={`relative flex gap-3 px-3.5 py-2 ${item.image !== undefined ? "items-center" : "items-baseline"}`}
                  >
                    {reserve ? (
                      <span className="flex w-9 shrink-0 items-center justify-end gap-1.5 text-[13px] font-semibold text-stage-soft tabular-nums">
                        <RankTrend change={resolved?.[i]} surface="stage" />
                        <span>{String(item.rank).padStart(2, "0")}</span>
                      </span>
                    ) : (
                      <span className="w-6 shrink-0 text-right text-[13px] font-semibold text-stage-soft tabular-nums">
                        {String(item.rank).padStart(2, "0")}
                      </span>
                    )}
                    {item.image !== undefined && (
                      <CoverThumb name={item.name} image={item.image} shape={shape} lookup={item.lookup} />
                    )}
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate font-bold text-stage-ink transition-colors duration-200 ease-smooth hover:text-amber"
                      >
                        {item.name}
                      </a>
                      {item.detail && <p className="truncate text-xs text-stage-soft">{item.detail}</p>}
                    </div>
                    <span
                      aria-label={formatPlays(item.playcount, lang)}
                      className="shrink-0 text-sm font-bold text-stage-ink tabular-nums"
                    >
                      {formatNumber(item.playcount, lang)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {canExpand && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-stage-line bg-stage-card/70 py-2 text-xs font-semibold text-stage-soft transition duration-200 ease-smooth hover:border-amber/50 hover:bg-stage-card hover:text-stage-ink active:scale-[0.98]"
            >
              <span>{expanded ? t.lists.showLess : t.lists.showMore(items.length)}</span>
              <svg
                aria-hidden
                viewBox="0 0 12 12"
                className={`size-3 transition-transform duration-200 ease-smooth ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 4.5 6 8l3.5-3.5" />
              </svg>
            </button>
          )}
        </>
      )}
    </section>
  );
}
