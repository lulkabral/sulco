import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { LOCKUP, LOCKUP_SVG, SYMBOL_AMBER, SYMBOL_DARK } from "@/lib/brand-symbol";

type Props = {
  /** "sm" para cabeçalhos, "lg" para a página inicial. */
  size?: "sm" | "lg";
};

const SIZES = {
  sm: "text-2xl",
  lg: "text-5xl sm:text-6xl",
};

/**
 * Logo "sulco" (lockup-currentcolor.svg do pacote de 22/11/2026) como SVG embutido: o disco
 * âmbar com o "s" do mesmo tamanho e na mesma linha de base de "ulco". A palavra usa
 * currentColor (segue o tema claro/escuro pelo `text-ink`); o disco é sempre âmbar.
 * Só a altura é definida (0,936em, a do disco) e a largura sai automática; `vertical-align`
 * de -0,209em põe a base do disco na linha das descendentes, como no texto ao redor.
 * Leitores de tela leem só "sulco".
 */
export function Logo({ size = "sm" }: Props) {
  const L = LOCKUP_SVG;
  return (
    <span className={`inline-block whitespace-nowrap leading-none text-ink ${SIZES[size]}`}>
      <span className="sr-only">sulco</span>
      <svg
        viewBox={L.viewBox}
        aria-hidden
        focusable="false"
        className="inline-block w-auto"
        style={{ height: `${LOCKUP.disc}em`, verticalAlign: `-${LOCKUP.belowBaseline}em` }}
      >
        <circle cx={L.disc.cx} cy={L.disc.cy} r={L.disc.r} fill={SYMBOL_AMBER} />
        <path d={L.sPath} fill={SYMBOL_DARK} />
        <circle cx={L.disc.cx} cy={L.disc.cy} r={L.ringRadius} fill={SYMBOL_DARK} />
        <circle cx={L.disc.cx} cy={L.disc.cy} r={L.holeRadius} fill={SYMBOL_AMBER} />
        <path d={L.ulcoPath} fill="currentColor" />
      </svg>
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
