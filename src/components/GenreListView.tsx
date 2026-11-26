"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import type { Genre } from "@/lib/genres";
import type { ArtistPicture } from "@/lib/artist-image";
import { CardShortcut } from "./CardShortcut";
import { CoverThumb } from "./CoverThumb";
import { ListIcon } from "./ListIcons";
import { GenresSkeleton } from "./ProfileSkeleton";
import { RankTrend, useResolvedRankChanges, type RankChangesInput } from "./RankTrend";

/** Moldura da lista "Gêneros" (palco escuro unificado). Serve no servidor e no navegador. */
export function GenreListView({ children, cardHref }: { children: ReactNode; cardHref?: string }) {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby="top-generos"
      className="min-w-0 rounded-[24px] border border-stage-line bg-stage p-5 text-stage-ink"
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-stage-line pb-3">
        <h3
          id="top-generos"
          className="flex items-center gap-2 text-lg font-bold leading-tight tracking-tight text-stage-ink sm:text-xl"
        >
          <ListIcon name="genres" />
          {t.lists.genres}
        </h3>
        {cardHref && <CardShortcut href={cardHref} listName={t.lists.genres} />}
      </div>
      {children}
    </section>
  );
}

/**
 * Itens da lista. `undefined` = ainda calculando; `null` = não deu para calcular.
 * Cada gênero é uma faixa translúcida proporcional ao peso (o 1º enche tudo), com
 * os artistas que mais puxaram aquele gênero em bolinhas sobrepostas.
 */
export function GenreItems({
  genres,
  images = {},
  changes,
}: {
  genres: Genre[] | null | undefined;
  images?: Record<string, ArtistPicture>;
  changes?: RankChangesInput;
}) {
  const { t } = useI18n();
  const { changes: resolved, reserve } = useResolvedRankChanges(changes);
  if (genres === undefined) return <GenresSkeleton />;
  if (genres === null) {
    return <p className="text-sm text-stage-soft">{t.lists.genresError}</p>;
  }
  if (genres.length === 0) {
    return <p className="text-sm text-stage-soft">{t.lists.genresNoTags}</p>;
  }

  const top = genres[0].weight;
  return (
    <ol className="flex flex-col">
      {genres.map((genre, i) => {
        const artists = genre.artists ?? [];
        return (
          <li
            key={genre.name}
            className="relative border-b border-stage-line last:border-b-0"
          >
            {/* Linha proporcional ao peso do 1º gênero. */}
            <div
              aria-hidden
              className="ranking-meter motion-safe:animate-grow"
              style={{
                width: `${Math.max(10, Math.round((genre.weight / top) * 100))}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
            <div className="relative flex items-center gap-3 px-3.5 py-2.5">
              {reserve ? (
                <span className="flex w-9 shrink-0 items-center justify-end gap-1.5 text-[13px] font-semibold text-stage-soft tabular-nums">
                  <RankTrend change={resolved?.[i]} surface="stage" />
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </span>
              ) : (
                <span className="w-6 shrink-0 text-right text-[13px] font-semibold text-stage-soft tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={`https://www.last.fm/tag/${encodeURIComponent(genre.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block truncate font-extrabold text-stage-ink transition-colors duration-200 ease-smooth hover:text-amber ${i === 0 ? "text-base" : "text-sm"}`}
                >
                  {genre.name}
                </a>
                {artists.length > 0 && (
                  <p className="truncate text-xs text-stage-soft">{joinNames(artists, t.units.and)}</p>
                )}
              </div>
              {artists.length > 0 && (
                <div aria-hidden className="flex shrink-0 -space-x-2">
                  {artists.map((name) => (
                    <CoverThumb
                      key={name}
                      name={name}
                      image={images[name]?.image ?? null}
                      lookup={images[name]?.lookup}
                      shape="round"
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** "A", "A e B", "A, B e C" ("A, B and C"). */
function joinNames(names: string[], and: string): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} ${and} ${names.at(-1)}`;
}

