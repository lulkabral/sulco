import Link from "next/link";
import type { ReactNode } from "react";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Perfis no X: o oficial do sulco e o de quem fez o site. */
export const X_SITE = "sulcofm";
export const X_AUTHOR = "alcoholicgoatt";

/**
 * Rodapé editorial de todas as páginas, numa linha (empilhada no celular): "sulco · frase"
 * à esquerda e links de texto em mono à direita, sem pílulas para não competir com a ação
 * principal. Inclui o crédito ao Last.fm (exigido pelos termos) e a privacidade.
 */
export async function SiteFooter() {
  const { t, href } = await getI18n();
  return (
    <footer className="border-t border-rule px-4 py-6 text-sm sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-ink-faint">
          <span className="font-extrabold tracking-tight text-ink">sulco</span> · {t.footer.line}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs tracking-[0.06em]">
          <FooterLink href={`https://x.com/${X_SITE}`} external label={t.footer.onX(X_SITE)}>
            @{X_SITE}
          </FooterLink>
          <FooterLink href={`https://x.com/${X_AUTHOR}`} external label={t.footer.onX(X_AUTHOR, t.footer.madeBy)}>
            {t.footer.madeBy} @{X_AUTHOR}
          </FooterLink>
          <FooterLink href="https://www.last.fm" external>
            {t.footer.lastfm}
          </FooterLink>
          <FooterLink href={href("/privacidade")}>{t.footer.privacy}</FooterLink>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  external = false,
  label,
  children,
}: {
  href: string;
  external?: boolean;
  /** Nome completo para leitores de tela (ex.: "@sulcofm no X (abre em outra aba)"). */
  label?: string;
  children: ReactNode;
}) {
  const className = "text-soft transition-colors hover:text-ink";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
