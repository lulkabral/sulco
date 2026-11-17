import type { CSSProperties } from "react";
import type { TrendingCover } from "@/lib/trending";

type Props = { covers: TrendingCover[] };

/**
 * Posição de cada capa na colagem, em % da caixa: [esquerda, topo, largura, giro em graus, fita?].
 * Fixas (não sorteadas) para a colagem não "pular" a cada visita. As duas últimas só no computador.
 */
const SLOTS: [number, number, number, number, boolean][] = [
  [1, 7, 34, -8, false],
  [29, 0, 38, 5, true],
  [65, 9, 32, -4, false],
  [6, 47, 33, 4, true],
  [37, 43, 36, -6, false],
  [70, 50, 28, 7, true],
];

/**
 * Colagem de capas (página inicial): capas reais "impressas" com borda clara, coladas
 * tortas com fita crepe, mais o adesivo "sem login". Decorativa: o bilhete abaixo diz o que é.
 */
export function CoverCollage({ covers }: Props) {
  const shown = covers.slice(0, SLOTS.length);
  return (
    <div aria-hidden className="relative aspect-[4/3] w-full">
      {shown.map((cover, i) => {
        const [left, top, width, rotate, tape] = SLOTS[i];
        const style = {
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          "--r": `${rotate}deg`,
          animationDelay: `${i * 70}ms`,
        } as CSSProperties;
        return (
          <div
            key={cover.imageUrl}
            style={style}
            className="absolute rotate-(--r) transition duration-300 hover:z-10 hover:-translate-y-1.5 hover:rotate-0 motion-safe:animate-stick"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.imageUrl}
              alt=""
              width={300}
              height={300}
              loading={i < 3 ? "eager" : "lazy"}
              className="block aspect-square w-full border-[3px] border-ink bg-card object-cover shadow-xl shadow-black/50"
            />
            {tape && (
              <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-12 bg-ink/75 sm:w-14" />
            )}
          </div>
        );
      })}
      <span className="absolute right-[1%] bottom-[2%] z-20 flex size-16 rotate-12 items-center justify-center rounded-full bg-amber text-center text-xs leading-tight font-extrabold text-amber-ink shadow-lg shadow-black/40 sm:size-20 sm:text-sm">
        sem
        <br />
        login
      </span>
    </div>
  );
}
