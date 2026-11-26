"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { formatNumber, formatPlays } from "@/lib/format";
import { VINYL_GROOVES, VINYL_SHEEN } from "@/lib/vinyl-color";
import { CardShortcut } from "./CardShortcut";
import { CoverThumb } from "./CoverThumb";
import { ListIcon } from "./ListIcons";
import { RankTrend, useResolvedRankChanges, type RankChangesInput } from "./RankTrend";
import type { TopListItem } from "./TopList";

type Props = {
  items: TopListItem[];
  /** Quantos itens aparecem antes de tocar em "Ver até o #N". */
  initialLimit?: number;
  /** Variação de posição em relação ao período anterior (síncrona ou Promise). */
  changes?: RankChangesInput;
  /** Endereço para abrir a aba Tops já em Álbuns. */
  cardHref?: string;
};

type ViewMode = "shelf" | "list";

/**
 * Cartão de Álbuns com dois modos instantâneos:
 * - "Prateleira" (padrão): Top 3 com capas 100% limpas (vinil espiando acima do #1),
 *   posição + seta abaixo da capa, reproduções em destaque e #04+ com preenchimento colorido.
 * - "Lista": #1 em destaque com vinil lateral + #02 em diante com preenchimento colorido.
 */
export function AlbumTopList({ items, initialLimit = 10, changes, cardHref }: Props) {
  const { lang, t } = useI18n();
  const [mode, setMode] = useState<ViewMode>("shelf");
  const [expanded, setExpanded] = useState(false);
  const { changes: resolved, reserve } = useResolvedRankChanges(changes);

  const canExpand = items.length > initialLimit;
  const visible = expanded ? items : items.slice(0, initialLimit);
  const top = items[0]?.playcount || 1;
  const useShelf = mode === "shelf" && visible.length >= 2;
  const podium = useShelf ? visible.slice(0, 3) : [];
  const listItems = useShelf ? visible.slice(3) : visible.slice(1);
  const listHero = !useShelf && visible.length > 0 ? visible[0] : null;

  const playUnitOf = (count: number) => {
    const numStr = formatNumber(count, lang);
    return formatPlays(count, lang).replace(numStr, "").trim();
  };

  return (
    <section
      aria-labelledby="top-albuns"
      className="min-w-0 rounded-[24px] border border-stage-line bg-stage p-5 text-stage-ink"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stage-line pb-3">
        <h3
          id="top-albuns"
          className="flex items-center gap-2 text-lg font-bold leading-tight tracking-tight text-stage-ink sm:text-xl"
        >
          <ListIcon name="albums" />
          {t.lists.albums}
        </h3>

        <div className="flex shrink-0 items-center gap-1.5">
          {items.length >= 2 && (
            <div
              role="group"
              aria-label={t.lists.viewModeLabel}
              className="inline-flex items-center rounded-full border border-stage-line bg-stage-card p-0.5"
            >
              {(["shelf", "list"] as const).map((option) => {
                const on = mode === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMode(option)}
                    className={
                      "cursor-pointer rounded-full px-2 py-1 text-[11px] font-semibold transition duration-200 ease-smooth active:scale-[0.97] sm:px-2.5 " +
                      (on
                        ? "bg-amber text-amber-ink shadow-xs"
                        : "text-stage-soft hover:text-stage-ink")
                    }
                  >
                    {option === "shelf" ? t.lists.viewShelf : t.lists.viewList}
                  </button>
                );
              })}
            </div>
          )}
          {cardHref && items.length > 0 && <CardShortcut href={cardHref} listName={t.lists.albums} />}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-stage-soft">{t.lists.empty}</p>
      ) : (
        <>
          {useShelf ? (
            <>
              {/* Prateleira editorial: capas 100% limpas, com vinil espiando acima do #1 e "01 ●" abaixo da foto. */}
              <ol className="grid grid-cols-3 gap-2.5 pt-3.5 sm:gap-3">
                {podium.map((item, i) => (
                  <li key={`${item.rank}-${item.name}`} className="group relative min-w-0">
                    {i === 0 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-[9%] -top-3.5 aspect-square rounded-full transition-transform duration-300 ease-smooth group-hover:-translate-y-1"
                        style={{
                          backgroundColor: "var(--color-vinyl)",
                          backgroundImage: VINYL_GROOVES,
                          boxShadow:
                            "inset 0 0 0 1px rgba(255, 255, 255, 0.22), 0 -2px 10px rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{ background: VINYL_SHEEN }}
                        />
                        <span className="absolute inset-[34%] rounded-full bg-amber/90" />
                      </span>
                    )}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.detail ? `${item.name} — ${item.detail}` : item.name}
                      className="block min-w-0"
                    >
                      <span
                        className={
                          "relative z-10 block aspect-square w-full overflow-hidden rounded-[3px] bg-stage-card shadow-md shadow-black/30 transition-transform duration-200 ease-smooth group-hover:-translate-y-0.5 " +
                          (i === 0
                            ? "ring-2 ring-amber/80"
                            : "ring-1 ring-stage-line group-hover:ring-amber/55")
                        }
                      >
                        <CoverThumb
                          name={item.name}
                          image={item.image ?? null}
                          shape="square"
                          size="fill"
                          lookup={item.lookup}
                        />
                      </span>
                    </a>

                    {/* Etiqueta de prateleira abaixo da capa: número limpo + seta independente fora do link. */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={
                          "text-[13px] font-bold leading-none tabular-nums " +
                          (i === 0 ? "text-amber" : "text-stage-soft")
                        }
                      >
                        {String(item.rank).padStart(2, "0")}
                      </span>
                      {resolved?.[i] && <RankTrend change={resolved[i]} surface="stage" />}
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block min-w-0"
                    >
                      <span className="block truncate text-xs font-extrabold leading-snug text-stage-ink transition-colors duration-200 ease-smooth group-hover:text-amber sm:text-[13px]">
                        {item.name}
                      </span>
                      {item.detail && (
                        <span className="block truncate text-[11px] text-stage-soft">
                          {item.detail}
                        </span>
                      )}
                      <span
                        aria-label={formatPlays(item.playcount, lang)}
                        className="mt-1 block truncate text-sm font-bold leading-tight text-stage-ink tabular-nums"
                      >
                        {formatNumber(item.playcount, lang)}
                        <span className="hidden text-xs font-normal text-stage-soft sm:inline">
                          {" "}
                          {playUnitOf(item.playcount)}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>

              {listItems.length > 0 && (
                <ol start={4} className="mt-4 flex flex-col border-t border-stage-line pt-3.5">
                  {listItems.map((item, idx) => {
                    const i = idx + 3;
                    return (
                      <AlbumRow
                        key={`${item.rank}-${item.name}`}
                        item={item}
                        index={i}
                        top={top}
                        change={resolved?.[i]}
                        reserve={reserve}
                      />
                    );
                  })}
                </ol>
              )}
            </>
          ) : (
            <ol className="flex flex-col">
              {listHero && (
                <li
                  key={`${listHero.rank}-${listHero.name}`}
                  className="group mb-1.5 rounded-2xl border border-stage-line bg-stage-card p-3.5"
                >
                  <div className="flex items-center gap-3.5">
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
                          <span className="absolute inset-[34%] rounded-full bg-amber ring-1 ring-black/40" />
                          <span className="absolute inset-[46%] rounded-full bg-vinyl" />
                        </span>
                      </span>
                      <span className="relative z-10 block size-16 overflow-hidden rounded-[4px] bg-stage shadow-[3px_4px_10px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
                        <CoverThumb
                          name={listHero.name}
                          image={listHero.image ?? null}
                          shape="square"
                          size="lg"
                          lookup={listHero.lookup}
                        />
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-amber tabular-nums">
                          {String(listHero.rank).padStart(2, "0")}
                        </span>
                        {reserve && <RankTrend change={resolved?.[0]} surface="stage" />}
                        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-stage-faint">
                          {t.lists.topAlbumBadge}
                        </span>
                      </div>
                      <a
                        href={listHero.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-base font-extrabold leading-tight text-stage-ink transition-colors duration-200 ease-smooth hover:text-amber"
                      >
                        {listHero.name}
                      </a>
                      {listHero.detail && (
                        <p className="mt-0.5 truncate text-xs text-stage-soft">{listHero.detail}</p>
                      )}
                      <p className="mt-1.5 flex items-baseline gap-1.5 sm:hidden">
                        <span className="text-sm font-bold leading-none text-stage-ink tabular-nums">
                          {formatNumber(listHero.playcount, lang)}
                        </span>
                        <span className="text-xs text-stage-soft">
                          {playUnitOf(listHero.playcount)}
                        </span>
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <span className="block text-xl font-extrabold leading-none text-stage-ink tabular-nums">
                        {formatNumber(listHero.playcount, lang)}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-stage-soft">
                        {playUnitOf(listHero.playcount)}
                      </span>
                    </div>
                  </div>
                </li>
              )}

              {listItems.map((item, idx) => {
                const i = idx + 1;
                return (
                  <AlbumRow
                    key={`${item.rank}-${item.name}`}
                    item={item}
                    index={i}
                    top={top}
                    change={resolved?.[i]}
                    reserve={reserve}
                  />
                );
              })}
            </ol>
          )}

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

function AlbumRow({
  item,
  index,
  top,
  change,
  reserve,
}: {
  item: TopListItem;
  index: number;
  top: number;
  change: ReturnType<typeof useResolvedRankChanges>["changes"] extends (infer T)[] | null ? T | undefined : never;
  reserve: boolean;
}) {
  const { lang } = useI18n();
  const pct = Math.max(6, Math.round((item.playcount / top) * 100));

  return (
    <li className="relative border-b border-stage-line last:border-b-0">
      <div
        aria-hidden
        className="ranking-meter motion-safe:animate-grow"
        style={{
          width: `${pct}%`,
          animationDelay: `${Math.min(index, 10) * 25}ms`,
        }}
      />
      <div className="relative flex items-center gap-3 px-3.5 py-2">
        {reserve ? (
          <span className="flex w-9 shrink-0 items-center justify-end gap-1.5 text-[13px] font-semibold text-stage-soft tabular-nums">
            <RankTrend change={change} surface="stage" />
            <span>{String(item.rank).padStart(2, "0")}</span>
          </span>
        ) : (
          <span className="w-6 shrink-0 text-right text-[13px] font-semibold text-stage-soft tabular-nums">
            {String(item.rank).padStart(2, "0")}
          </span>
        )}
        <CoverThumb name={item.name} image={item.image ?? null} shape="square" lookup={item.lookup} />
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
}
