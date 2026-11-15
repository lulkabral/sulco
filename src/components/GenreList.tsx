import { Suspense } from "react";
import type { Genre } from "@/lib/genres";
import { GenreListView, GenreItems } from "./GenreListView";
import { GenresSkeleton } from "./ProfileSkeleton";

type Props = {
  /** Gêneros que ainda estão sendo calculados no servidor. null = não deu para calcular. */
  genres: Promise<Genre[] | null>;
};

/**
 * Lista "Gêneros" da página com períodos do Last.fm. O título aparece na hora; os itens
 * chegam quando o cálculo termina no servidor (streaming), sem atrasar as outras listas.
 */
export function GenreList({ genres }: Props) {
  return (
    <GenreListView>
      <Suspense fallback={<GenresSkeleton />}>
        <AwaitGenres genres={genres} />
      </Suspense>
    </GenreListView>
  );
}

async function AwaitGenres({ genres }: Props) {
  return <GenreItems genres={await genres} />;
}
