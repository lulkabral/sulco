import Image from "next/image";
import type { CSSProperties } from "react";
import { TILE_COLORS } from "@/lib/theme";

type Props = {
  /** Endereços das capas. Sem capas, usa peças abstratas coloridas. */
  covers?: string[];
  /** Lado de cada peça, em px. */
  size: number;
  /** Segundos para dar uma volta completa (maior = mais devagar). */
  seconds: number;
  /** Anda para a direita em vez de para a esquerda. */
  reverse?: boolean;
  /** Desloca a paleta das peças abstratas (para duas faixas não ficarem iguais). */
  offset?: number;
};

/**
 * Faixa de capas passando sem parar (decorativa: leitores de tela ignoram).
 * Só CSS: o conteúdo aparece duas vezes e a faixa desliza até a metade, então
 * o fim encaixa no começo. Para com o mouse em cima e fica parada para quem
 * pediu "reduzir movimento" no sistema.
 */
export function Marquee({ covers, size, seconds, reverse = false, offset = 0 }: Props) {
  const items =
    covers && covers.length > 0
      ? covers.map((url, i) => (
          <Image
            key={`${url}-${i}`}
            src={url}
            alt=""
            width={size}
            height={size}
            sizes={`${size}px`}
            // Sem "lazy": as cópias que começam fora da tela entram deslizando já carregadas.
            loading="eager"
            className="shrink-0 rounded-lg object-cover"
            style={{ width: size, height: size }}
          />
        ))
      : TILE_COLORS.map((_, i) => <Tile key={i} index={i + offset} size={size} />);

  const style = {
    "--marquee-duration": `${seconds}s`,
    animationDirection: reverse ? "reverse" : undefined,
  } as CSSProperties;

  return (
    <div aria-hidden className="group overflow-hidden">
      <div
        style={style}
        className="flex w-max gap-2 motion-safe:animate-marquee group-hover:[animation-play-state:paused]"
      >
        {/* Duas cópias lado a lado: quando a 1ª sai, a 2ª está no lugar dela. */}
        <div className="flex gap-2">{items}</div>
        <div className="flex gap-2">{items}</div>
      </div>
    </div>
  );
}

/** Peça abstrata: quadrado, disco (vinil) ou quadrado com "selo" no meio. */
function Tile({ index, size }: { index: number; size: number }) {
  const color = TILE_COLORS[index % TILE_COLORS.length];
  const shape = index % 3;
  if (shape === 1) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "#0d0b09" }}
      >
        <div className="rounded-full" style={{ width: size * 0.38, height: size * 0.38, background: color }} />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: size, height: size, background: color }}
    >
      {shape === 2 && (
        <div className="rounded-full bg-black/25" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  );
}
