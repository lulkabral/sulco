"use client";

import { useEffect, useRef, useState } from "react";
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
 * Capa que não veio com a lista só é buscada quando o item fica perto da área visível
 * (no celular, abas escondidas não disparam pedidos à toa nem disputam rede com o recap/grade).
 */
export function CoverThumb({ name, image, shape, lookup, size = "md" }: Props) {
  const [fetched, setFetched] = useState<string | null>(null);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const url = image ?? fetched;

  useEffect(() => {
    if (image || !lookup) return;
    let alive = true;
    const run = () => {
      findCover(lookup).then((u) => alive && setFetched(u));
    };

    const el = placeholderRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      run();
      return () => {
        alive = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        run();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [image, lookup?.type, lookup?.artist, lookup?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const px = size === "sm" ? 28 : 40;
  const box =
    (size === "sm" ? "size-7 text-xs ring-2 ring-terra " : "size-10 ring-1 ring-line ") +
    `shrink-0 ${shape === "round" ? "rounded-full" : "rounded-lg"}`;
  if (!url) {
    return (
      <span
        ref={placeholderRef}
        aria-hidden
        className={`${box} flex items-center justify-center font-extrabold uppercase ${size === "sm" ? "bg-stage text-amber" : "bg-card-2 text-terra-text"}`}
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbUrl(url)}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={`${box} object-cover`}
    />
  );
}
