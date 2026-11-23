"use client";

import { useEffect, useRef, useState } from "react";
import type { CoverLookup } from "@/lib/artist-image";
import { coverUrl, thumbUrl } from "@/lib/grid/layout";
import { findCover } from "@/lib/lookups";

type Props = {
  /** Nome do item (a inicial aparece quando não há imagem). */
  name: string;
  /** Imagem já conhecida; null = sem imagem (ou ainda a buscar, se houver `lookup`). */
  image: string | null;
  /** "round" para artistas, "square" para músicas e álbuns. */
  shape: "round" | "square";
  /**
   * "sm": bolinhas dos gêneros (28 px)
   * "md": linhas padrão das listas (40 px)
   * "lg": destaque #1 (64 px, usa versão 300 px para nitidez em retina)
   * "fill": preenche o contêiner quadrado (prateleira de álbuns, cantos retos de LP)
   */
  size?: "sm" | "md" | "lg" | "fill";
  /** Sem imagem conhecida: álbum ou música cuja capa buscar pela nossa rota. */
  lookup?: CoverLookup;
};

/**
 * Miniatura das listas do top. Imagens vêm direto do Last.fm (174 px nas linhas e
 * 300 px nos destaques/prateleira). Capa que não veio com a lista só é buscada quando
 * o item fica perto da área visível (no celular, abas escondidas não disparam pedidos à toa).
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

  const px = size === "sm" ? 28 : size === "md" ? 40 : size === "lg" ? 64 : 300;
  const radius =
    shape === "round" ? "rounded-full" : size === "fill" ? "rounded-[3px]" : size === "lg" ? "rounded-[4px]" : "rounded-lg";
  const box =
    size === "sm"
      ? `size-7 shrink-0 text-xs ring-2 ring-terra ${radius}`
      : size === "md"
        ? `size-10 shrink-0 ring-1 ring-line ${radius}`
        : size === "lg"
          ? `size-16 shrink-0 text-lg ring-1 ring-line ${radius}`
          : `size-full text-2xl ${radius}`;

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

  const src = size === "lg" || size === "fill" ? coverUrl(url, 300) : thumbUrl(url);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
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
