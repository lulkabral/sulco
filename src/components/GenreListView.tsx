import type { ReactNode } from "react";
import type { Genre } from "@/lib/genres";
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

/** Itens da lista. `undefined` = ainda calculando; `null` = não deu para calcular. */
export function GenreItems({ genres }: { genres: Genre[] | null | undefined }) {
  if (genres === undefined) return <GenresSkeleton />;
  if (genres === null) {
    return <p className="text-sm text-ink-soft">Não deu para calcular agora. Tente recarregar a página.</p>;
  }
  if (genres.length === 0) {
    return <p className="text-sm text-ink-soft">Os artistas deste período não têm tags suficientes no Last.fm.</p>;
  }

  const top = genres[0].weight;
  return (
    <ol className="flex flex-col gap-3">
      {genres.map((genre, i) => (
        <li key={genre.name} className="flex items-baseline gap-3">
          <span className="w-5 shrink-0 text-right text-sm font-extrabold tabular-nums text-amber">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.last.fm/tag/${encodeURIComponent(genre.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-semibold hover:text-amber"
            >
              {genre.name}
            </a>
            {/* Barra proporcional ao peso do 1º gênero: dá ideia da distância entre eles. */}
            <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full origin-left rounded-full bg-amber motion-safe:animate-grow"
                style={{
                  width: `${Math.max(4, Math.round((genre.weight / top) * 100))}%`,
                  opacity: i === 0 ? 1 : 0.65,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
