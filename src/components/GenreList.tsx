import { Suspense } from "react";
import type { Genre } from "@/lib/genres";
import { GenreListView, GenreItems } from "./GenreListView";
import { GenresSkeleton } from "./ProfileSkeleton";

type Props = {
  /** Gêneros que ainda estão sendo calculados no servidor. null = não deu para calcular. */
  genres: Promise<Genre[] | null>;
  /** Nome do artista -> imagem, para as bolinhas de cada gênero. */
  images?: Record<string, string | null>;
};

/**
 * Lista "Gêneros" da página com períodos do Last.fm. O título aparece na hora; os itens
 * chegam quando o cálculo termina no servidor (streaming), sem atrasar as outras listas.
 */
export function GenreList({ genres, images }: Props) {
  return (
    <GenreListView>
      <Suspense fallback={<GenresSkeleton />}>
        <AwaitGenres genres={genres} images={images} />
      </Suspense>
    </GenreListView>
  );
}

async function AwaitGenres({ genres, images }: Props) {
  return <GenreItems genres={await genres} images={images} />;
}
