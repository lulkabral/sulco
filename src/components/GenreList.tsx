import { Suspense } from "react";
import type { ArtistPicture } from "@/lib/artist-image";
import type { Genre } from "@/lib/genres";
import { GenreListView, GenreItems } from "./GenreListView";
import { GenresSkeleton } from "./ProfileSkeleton";
import type { RankChangesInput } from "./RankTrend";

type Props = {
  /** Gêneros que ainda estão sendo calculados no servidor. null = não deu para calcular. */
  genres: Promise<Genre[] | null>;
  /** Nome do artista -> imagem, para as bolinhas de cada gênero. */
  images?: Record<string, ArtistPicture>;
  /** Variação de posição dos gêneros em relação ao período anterior (chega depois). */
  changes?: RankChangesInput;
  /** Endereço para abrir a aba Tops já em Gêneros. */
  cardHref?: string;
};

/**
 * Lista "Gêneros" da página com períodos do Last.fm. O título aparece na hora; os itens
 * chegam quando o cálculo termina no servidor (streaming), sem atrasar as outras listas.
 */
export function GenreList({ genres, images, changes, cardHref }: Props) {
  return (
    <GenreListView cardHref={cardHref}>
      <Suspense fallback={<GenresSkeleton />}>
        <AwaitGenres genres={genres} images={images} changes={changes} />
      </Suspense>
    </GenreListView>
  );
}

async function AwaitGenres({ genres, images, changes }: Props) {
  return <GenreItems genres={await genres} images={images} changes={changes} />;
}
