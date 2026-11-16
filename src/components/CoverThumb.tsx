"use client";

import { useEffect, useState } from "react";
import { thumbUrl } from "@/lib/grid/layout";

type Props = {
  /** Nome do item (a inicial aparece quando não há imagem). */
  name: string;
  /** Imagem já conhecida; null = sem imagem (ou ainda a buscar, se houver `track`). */
  image: string | null;
  /** "round" para artistas, "square" para músicas e álbuns. */
  shape: "round" | "square";
  /** Música sem capa conhecida: busca a capa do álbum dela pela nossa rota. */
  track?: { artist: string; name: string };
};

/**
 * Miniatura das listas do top. Imagens vêm direto do Last.fm (versão 174 px).
 * Para músicas, a capa é buscada aqui no navegador, depois que a lista aparece,
 * para não atrasar a página.
 */
export function CoverThumb({ name, image, shape, track }: Props) {
  const [fetched, setFetched] = useState<string | null>(null);
  const url = image ?? fetched;

  useEffect(() => {
    if (image || !track) return;
    let alive = true;
    trackCover(track.artist, track.name).then((u) => alive && setFetched(u));
    return () => {
      alive = false;
    };
  }, [image, track?.artist, track?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const box = `size-10 shrink-0 ring-1 ring-line ${shape === "round" ? "rounded-full" : "rounded-md"}`;
  if (!url) {
    return (
      <span aria-hidden className={`${box} flex items-center justify-center bg-card-2 font-extrabold uppercase text-amber`}>
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(url)} alt="" width={40} height={40} loading="lazy" className={`${box} object-cover`} />
  );
}

// Capas de música já pedidas nesta visita (a mesma música pode aparecer em outra lista).
const cache = new Map<string, Promise<string | null>>();
// No máximo 3 pedidos ao mesmo tempo (regra do projeto).
const MAX_PARALLEL = 3;
let running = 0;
const waiting: (() => void)[] = [];

function trackCover(artist: string, name: string): Promise<string | null> {
  const key = `${artist}\u0000${name}`;
  let p = cache.get(key);
  if (!p) {
    p = limited(async () => {
      try {
        const res = await fetch(`/api/lastfm/track?${new URLSearchParams({ artist, track: name })}`);
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
