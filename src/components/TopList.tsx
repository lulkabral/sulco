"use client";

import { useI18n } from "@/i18n/client";
import { formatPlays } from "@/lib/format";
import type { CoverLookup } from "@/lib/artist-image";
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
  /** Variação de posição em relação ao período anterior (síncrona ou Promise). */
  changes?: RankChangesInput;
};

/**
 * Lista numerada de um top, num cartão. Cada item leva para a página no Last.fm
 * e tem uma barrinha proporcional ao 1º colocado (que cresce ao aparecer).
 */
export function TopList({ title, icon, items, shape = "square", changes }: Props) {
  const { lang, t } = useI18n();
  const { changes: resolved, reserve } = useResolvedRankChanges(changes);
  const top = items[0]?.playcount || 1;
  return (
    <section
      aria-labelledby={`top-${title}`}
      className="min-w-0 rounded-[24px] border border-line bg-card p-5 motion-safe:animate-rise"
    >
      <h3
        id={`top-${title}`}
        className="mb-4 flex items-center gap-2 border-b border-rule pb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-terra-text"
      >
        <ListIcon name={icon} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-soft">{t.lists.empty}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li
              key={`${item.rank}-${item.name}`}
              className={`flex gap-3 ${item.image !== undefined ? "items-center" : "items-baseline"}`}
            >
              {reserve ? (
                <span className="flex w-9 shrink-0 items-center justify-end gap-1.5 font-mono text-xs font-semibold text-ink-faint tabular-nums">
                  <RankTrend change={resolved?.[i]} />
                  <span>{String(item.rank).padStart(2, "0")}</span>
                </span>
              ) : (
                <span className="w-6 shrink-0 text-right font-mono text-xs font-semibold text-ink-faint tabular-nums">
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
                  className="block truncate font-bold text-ink transition-colors duration-200 ease-smooth hover:text-terra-text"
                >
                  {item.name}
                </a>
                <p className="truncate text-xs text-soft">
                  {item.detail ? `${item.detail} · ` : ""}
                  {formatPlays(item.playcount, lang)}
                </p>
                <div aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-card-2">
                  <div
                    className={
                      "h-full origin-left rounded-full motion-safe:animate-grow " +
                      (i === 0 ? "bg-terra" : "bg-terra/55")
                    }
                    style={{
                      width: `${Math.max(4, Math.round((item.playcount / top) * 100))}%`,
                      opacity: i === 0 ? 1 : 0.75,
                      animationDelay: `${i * 35}ms`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

