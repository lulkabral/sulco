import type { ReactNode } from "react";
import type { Genre } from "@/lib/genres";
import { thumbUrl } from "@/lib/grid/layout";
import { ListIcon } from "./ListIcons";
import { GenresSkeleton } from "./ProfileSkeleton";

/** Moldura da lista "Gêneros" (cartão com título). Serve no servidor e no navegador. */
export function GenreListView({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="top-generos" className="min-w-0 rounded-2xl bg-card p-4 motion-safe:animate-rise">
      <h2 id="top-generos" className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
        <ListIcon name="genres" />
        Gêneros
      </h2>
      {children}
    </section>
  );
}

/**
 * Itens da lista. `undefined` = ainda calculando; `null` = não deu para calcular.
 * Cada gênero é uma faixa que se enche de âmbar conforme o peso (o 1º enche tudo), com
 * os artistas que mais puxaram aquele gênero em bolinhas sobrepostas.
 * `images`: nome do artista -> imagem (capa do álbum mais ouvido), como na lista "Artistas".
 */
export function GenreItems({
  genres,
  images = {},
}: {
  genres: Genre[] | null | undefined;
  images?: Record<string, string | null>;
}) {
  if (genres === undefined) return <GenresSkeleton />;
  if (genres === null) {
    return <p className="text-sm text-ink-soft">Não deu para calcular agora. Tente recarregar a página.</p>;
  }
  if (genres.length === 0) {
    return <p className="text-sm text-ink-soft">Os artistas deste período não têm tags suficientes no Last.fm.</p>;
  }

  const top = genres[0].weight;
  return (
    <ol className="flex flex-col gap-2">
      {genres.map((genre, i) => {
        const artists = genre.artists ?? [];
        return (
          <li key={genre.name} className="relative overflow-hidden rounded-xl bg-card-2/60 ring-1 ring-line">
            {/* Preenchimento proporcional ao peso do 1º gênero. */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 origin-left bg-amber motion-safe:animate-grow"
              style={{
                width: `${Math.max(8, Math.round((genre.weight / top) * 100))}%`,
                opacity: i === 0 ? 0.22 : 0.12,
                animationDelay: `${i * 60}ms`,
              }}
            />
            <div className="relative flex items-center gap-3 px-3 py-2.5">
              <span className="w-4 shrink-0 text-right text-sm font-extrabold tabular-nums text-amber">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <a
                  href={`https://www.last.fm/tag/${encodeURIComponent(genre.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block truncate font-bold hover:text-amber ${i === 0 ? "text-lg" : ""}`}
                >
                  {genre.name}
                </a>
                {artists.length > 0 && (
                  <p className="truncate text-xs text-ink-soft">{joinNames(artists)}</p>
                )}
              </div>
              {artists.length > 0 && (
                <div aria-hidden className="flex shrink-0 -space-x-2.5">
                  {artists.map((name) => (
                    <Bubble key={name} name={name} image={images[name] ?? null} />
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

/** "A", "A e B", "A, B e C". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

/** Bolinha do artista (capa do álbum mais ouvido) ou a inicial. */
function Bubble({ name, image }: { name: string; image: string | null }) {
  const box = "size-7 rounded-full ring-2 ring-card";
  if (!image) {
    return (
      <span className={`${box} flex items-center justify-center bg-card-2 text-xs font-extrabold uppercase text-amber`}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(image)} alt="" width={28} height={28} loading="lazy" className={`${box} object-cover`} />
  );
}
