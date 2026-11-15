import { Suspense } from "react";
import type { Genre } from "@/lib/genres";
import { GenresSkeleton } from "./ProfileSkeleton";

type Props = {
  /** Gêneros que ainda estão sendo calculados no servidor. null = não deu para calcular. */
  genres: Promise<Genre[] | null>;
};

/**
 * Lista "Gêneros". O título aparece na hora; os itens chegam quando o cálculo termina
 * (streaming), sem atrasar as outras listas.
 */
export function GenreList({ genres }: Props) {
  return (
    <section aria-labelledby="top-generos" className="min-w-0">
      <h2 id="top-generos" className="mb-3 text-lg font-semibold">
        Gêneros
      </h2>
      <Suspense fallback={<GenresSkeleton />}>
        <GenreItems genres={genres} />
      </Suspense>
    </section>
  );
}

async function GenreItems({ genres }: Props) {
  const list = await genres;
  if (list === null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Não deu para calcular agora. Tente recarregar a página.
      </p>
    );
  }
  if (list.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Os artistas deste período não têm tags suficientes no Last.fm.
      </p>
    );
  }

  const top = list[0].weight;
  return (
    <ol className="flex flex-col gap-3">
      {list.map((genre, i) => (
        <li key={genre.name} className="flex items-baseline gap-3">
          <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-500">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.last.fm/tag/${encodeURIComponent(genre.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-medium hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              {genre.name}
            </a>
            {/* Barra proporcional ao peso do 1º gênero: dá ideia da distância entre eles. */}
            <div aria-hidden className="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.max(4, Math.round((genre.weight / top) * 100))}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
