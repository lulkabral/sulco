"use client";

import { useI18n } from "@/i18n/client";
import { formatPlays } from "@/lib/format";
import type { CoverLookup } from "@/lib/artist-image";
import { CoverThumb } from "./CoverThumb";
import { ListIcon, type ListIconName } from "./ListIcons";

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
};

/**
 * Lista numerada de um top, num cartão. Cada item leva para a página no Last.fm
 * e tem uma barrinha proporcional ao 1º colocado (que cresce ao aparecer).
 */
export function TopList({ title, icon, items, shape = "square" }: Props) {
  const { lang, t } = useI18n();
  const top = items[0]?.playcount || 1;
  return (
    <section aria-labelledby={`top-${title}`} className="min-w-0 rounded-2xl bg-card p-4 motion-safe:animate-rise">
      <h2 id={`top-${title}`} className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
        <ListIcon name={icon} />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">{t.lists.empty}</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <li
              key={`${item.rank}-${item.name}`}
              className={`flex gap-3 ${item.image !== undefined ? "items-center" : "items-baseline"}`}
            >
              <span className="w-5 shrink-0 text-right text-sm font-extrabold tabular-nums text-amber">
                {item.rank}
              </span>
              {item.image !== undefined && (
                <CoverThumb name={item.name} image={item.image} shape={shape} lookup={item.lookup} />
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-semibold hover:text-amber"
                >
                  {item.name}
                </a>
                <p className="truncate text-sm text-ink-soft">
                  {item.detail ? `${item.detail} · ` : ""}
                  {formatPlays(item.playcount, lang)}
                </p>
                <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full origin-left rounded-full bg-amber motion-safe:animate-grow"
                    style={{
                      width: `${Math.max(3, Math.round((item.playcount / top) * 100))}%`,
                      opacity: i === 0 ? 1 : 0.65,
                      animationDelay: `${i * 40}ms`,
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

