import Image from "next/image";
import Link from "next/link";
import { getI18n } from "@/i18n/server";

type Props = {
  /** "sm" para cabeçalhos, "lg" para a página inicial. */
  size?: "sm" | "lg";
};

const SIZES = {
  sm: "text-2xl",
  lg: "text-5xl sm:text-6xl",
};

/**
 * Logo "sulco": o disco de vinil (que é o "S") + "ulco" em Plus Jakarta Sans 800, minúsculas.
 * O disco tem a altura do "l" e se apoia na linha de base, como no lockup de brand/.
 * O SVG entra por <img> (next/image): assim os ids internos dele não se repetem
 * quando o logo aparece mais de uma vez na página.
 * Leitores de tela leem só "sulco".
 */
export function Logo({ size = "sm" }: Props) {
  return (
    <span className={`inline-flex items-baseline font-extrabold leading-none tracking-tighter text-ink ${SIZES[size]}`}>
      <span className="sr-only">sulco</span>
      <Image
        src="/brand/simbolo.svg"
        alt=""
        aria-hidden
        width={400}
        height={400}
        unoptimized
        priority={size === "lg"}
        // O desenho ocupa 380 dos 400 px do SVG: 0,85em deixa o disco da altura do "l".
        className="relative top-[0.04em] mr-[0.01em] h-[0.85em] w-auto"
      />
      <span aria-hidden>ulco</span>
    </span>
  );
}

/** Logo pequeno que leva à página inicial (cabeçalho das outras páginas). */
export async function LogoLink() {
  const { t, href } = await getI18n();
  return (
    <Link href={href("/")} aria-label={t.common.homeLabel} className="inline-block rounded-md transition hover:opacity-80">
      <Logo size="sm" />
    </Link>
  );
}
