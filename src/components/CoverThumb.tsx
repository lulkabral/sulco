"use client";

import { useEffect, useState } from "react";
import type { CoverLookup } from "@/lib/artist-image";
import { thumbUrl } from "@/lib/grid/layout";

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

// Capas já pedidas nesta visita (o mesmo álbum pode aparecer em mais de uma lista).
const cache = new Map<string, Promise<string | null>>();
// No máximo 3 pedidos ao mesmo tempo (regra do projeto).
const MAX_PARALLEL = 3;
let running = 0;
const waiting: (() => void)[] = [];

function findCover({ type, artist, name }: CoverLookup): Promise<string | null> {
  const key = `${type}\u0000${artist}\u0000${name}`;
  let p = cache.get(key);
  if (!p) {
    p = limited(async () => {
      try {
        const res = await fetch(`/api/lastfm/${type}?${new URLSearchParams({ artist, [type]: name })}`);
        if (!res.ok) return null;
        const data = (await res.json()) as { imageUrl?: string | null };
        return data.imageUrl ?? null;
      } catch {
        return null;
      }
    });
    cache.set(key, p);
  }
  return p;
}

async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}
