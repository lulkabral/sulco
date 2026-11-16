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

/**
 * Peça abstrata viva (só na página inicial, que ainda não tem capas):
 * vinil girando, quadrado "respirando" ou forma orgânica que se deforma.
 * O atraso negativo faz cada peça começar num ponto diferente da animação.
 */
function Tile({ index, size }: { index: number; size: number }) {
  const color = TILE_COLORS[index % TILE_COLORS.length];
  const delay = { animationDelay: `-${((index * 0.73) % 6).toFixed(2)}s` };
  const shape = index % 3;

  if (shape === 0) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full motion-safe:animate-spin-slow"
        style={{
          width: size,
          height: size,
          ...delay,
          // Sulcos do disco.
          background: "repeating-radial-gradient(circle, #0b0a09 0 2px, #1b1714 2px 4px)",
          // Borda clara bem sutil, para o disco não sumir no fundo escuro.
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)",
        }}
      >
        {/* Selo com um "brilho" de lado: é o que deixa ver o giro. */}
        <div
          className="rounded-full"
          style={{
            width: size * 0.38,
            height: size * 0.38,
            background: color,
            borderLeft: `${Math.round(size * 0.07)}px solid rgba(255,255,255,0.3)`,
          }}
        />
      </div>
    );
  }
  if (shape === 1) {
    return (
      <div className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <div
          className="rounded-xl motion-safe:animate-breathe"
          style={{ width: size * 0.9, height: size * 0.9, background: color, ...delay }}
        />
      </div>
    );
  }
  return (
    <div
      className="shrink-0 rounded-[42%_58%_63%_37%/41%_44%_56%_59%] motion-safe:animate-blob"
      style={{ width: size, height: size, background: color, ...delay }}
    />
  );
}
