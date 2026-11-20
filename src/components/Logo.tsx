import Link from "next/link";
import { getI18n } from "@/i18n/server";
import {
  LOCKUP,
  SYMBOL_AMBER,
  SYMBOL_CENTER,
  SYMBOL_DARK,
  SYMBOL_DISC_VIEWBOX,
  SYMBOL_HOLE_RADIUS,
  SYMBOL_RADIUS,
  SYMBOL_RING_RADIUS,
  SYMBOL_S_PATH,
} from "@/lib/brand-symbol";

type Props = {
  /** "sm" para cabeçalhos, "lg" para a página inicial. */
  size?: "sm" | "lg";
};

const SIZES = {
  sm: "text-2xl",
  lg: "text-5xl sm:text-6xl",
};

/**
 * Logo "sulco" (novembro de 2026): o disco âmbar com o "s" é a primeira letra, seguido de
 * "ulco" como texto de verdade (DM Sans 800, minúsculas), na cor do texto do tema.
 * Proporções em docs/MARCA.md: disco de 0,787em, topo no topo do "l", base 0,063em abaixo
 * da linha de base, 0,01em até o "u". O disco é SVG embutido, sempre âmbar.
 * Sempre com o furo central (decisão do dono, 20/11/2026: também no cabeçalho, onde o disco
 * tem ~19 px). A versão mini, sem furo, fica só para o favicon. Leitores de tela leem "sulco".
 */
export function Logo({ size = "sm" }: Props) {
  return (
    <span className={`inline-block whitespace-nowrap font-extrabold leading-none text-ink ${SIZES[size]}`}>
      <span className="sr-only">sulco</span>
      <svg
        viewBox={SYMBOL_DISC_VIEWBOX}
        aria-hidden
        focusable="false"
        className="inline-block"
        style={{
          width: `${LOCKUP.disc}em`,
          height: `${LOCKUP.disc}em`,
          verticalAlign: `-${LOCKUP.belowBaseline}em`,
          marginRight: `${LOCKUP.gap}em`,
        }}
      >
        <circle cx={SYMBOL_CENTER} cy={SYMBOL_CENTER} r={SYMBOL_RADIUS} fill={SYMBOL_AMBER} />
        <path d={SYMBOL_S_PATH} fill={SYMBOL_DARK} />
        <circle cx={SYMBOL_CENTER} cy={SYMBOL_CENTER} r={SYMBOL_RING_RADIUS} fill={SYMBOL_DARK} />
        <circle cx={SYMBOL_CENTER} cy={SYMBOL_CENTER} r={SYMBOL_HOLE_RADIUS} fill={SYMBOL_AMBER} />
      </svg>
      <span aria-hidden style={{ letterSpacing: `${LOCKUP.letterSpacing}em` }}>
        ulco
      </span>
    </span>
  );
}

/** Logo pequeno que leva à página inicial (cabeçalho das outras páginas). */
export async function LogoLink() {
  const { t, href } = await getI18n();
  return (
    <Link href={href("/")} aria-label={t.common.homeLabel} className="inline-block rounded-md transition-opacity duration-200 ease-smooth hover:opacity-80">
      <Logo size="sm" />
    </Link>
  );
}
