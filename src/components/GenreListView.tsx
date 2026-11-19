"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import type { Genre } from "@/lib/genres";
import type { ArtistPicture } from "@/lib/artist-image";
import { CoverThumb } from "./CoverThumb";
import { ListIcon } from "./ListIcons";
import { GenresSkeleton } from "./ProfileSkeleton";

/** Moldura da lista "Gêneros" (cartão terracota vibrante). Serve no servidor e no navegador. */
export function GenreListView({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby="top-generos"
      className="min-w-0 rounded-[24px] bg-terra p-5 text-terra-ink shadow-md motion-safe:animate-rise"
    >
      <h3
        id="top-generos"
        className="mb-4 flex items-center gap-2 border-b border-white/20 pb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-terra-ink"
      >
        <ListIcon name="genres" />
        {t.lists.genres}
      </h3>
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
}: {
  genres: Genre[] | null | undefined;
  images?: Record<string, ArtistPicture>;
}) {
  const { t } = useI18n();
  if (genres === undefined) return <GenresSkeleton />;
  if (genres === null) {
    return <p className="text-sm text-terra-ink/90">{t.lists.genresError}</p>;
  }
  if (genres.length === 0) {
    return <p className="text-sm text-terra-ink/90">{t.lists.genresNoTags}</p>;
  }

  const top = genres[0].weight;
  return (
    <ol className="flex flex-col gap-2.5">
      {genres.map((genre, i) => {
        const artists = genre.artists ?? [];
        return (
          <li key={genre.name} className="relative overflow-hidden rounded-2xl bg-black/20">
            {/* Preenchimento proporcional ao peso do 1º gênero. */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 origin-left bg-white motion-safe:animate-grow"
              style={{
                width: `${Math.max(10, Math.round((genre.weight / top) * 100))}%`,
                opacity: i === 0 ? 0.22 : 0.12,
                animationDelay: `${i * 50}ms`,
              }}
            />
            <div className="relative flex items-center gap-3 px-3.5 py-2.5">
              <span className="w-5 shrink-0 text-right font-mono text-xs font-semibold text-terra-ink/80 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={`https://www.last.fm/tag/${encodeURIComponent(genre.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block truncate font-extrabold text-terra-ink underline-offset-4 hover:underline ${i === 0 ? "text-base" : "text-sm"}`}
                >
                  {genre.name}
                </a>
                {artists.length > 0 && (
                  <p className="truncate text-xs text-terra-ink/85">{joinNames(artists, t.units.and)}</p>
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

