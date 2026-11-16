"use client";

import { useEffect, useState } from "react";
import type { CoverLookup } from "@/lib/artist-image";
import { thumbUrl } from "@/lib/grid/layout";
import { findCover } from "@/lib/lookups";

type Props = {
  /** Nome do item (a inicial aparece quando não há imagem). */
  name: string;
  /** Imagem já conhecida; null = sem imagem (ou ainda a buscar, se houver `lookup`). */
  image: string | null;
  /** "round" para artistas, "square" para músicas e álbuns. */
  shape: "round" | "square";
  /** Sem imagem conhecida: álbum ou música cuja capa buscar pela nossa rota. */
  lookup?: CoverLookup;
  /** "md" nas listas (40 px), "sm" nas bolinhas dos gêneros (28 px). */
  size?: "md" | "sm";
};

/**
 * Miniatura das listas do top. Imagens vêm direto do Last.fm (versão 174 px).
 * Capa que não veio com a lista (música, ou álbum do ano além das primeiras) é buscada
 * aqui no navegador, depois que a lista aparece, para não atrasar a página.
 */
export function CoverThumb({ name, image, shape, lookup, size = "md" }: Props) {
  const [fetched, setFetched] = useState<string | null>(null);
  const url = image ?? fetched;

  useEffect(() => {
    if (image || !lookup) return;
    let alive = true;
    findCover(lookup).then((u) => alive && setFetched(u));
    return () => {
      alive = false;
    };
  }, [image, lookup?.type, lookup?.artist, lookup?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const px = size === "sm" ? 28 : 40;
  const box =
    (size === "sm" ? "size-7 text-xs ring-2 ring-card " : "size-10 ring-1 ring-line ") +
    `shrink-0 ${shape === "round" ? "rounded-full" : "rounded-md"}`;
  if (!url) {
    return (
      <span aria-hidden className={`${box} flex items-center justify-center bg-card-2 font-extrabold uppercase text-amber`}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(url)} alt="" width={px} height={px} loading="lazy" className={`${box} object-cover`} />
  );
}
