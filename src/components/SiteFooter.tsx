import Link from "next/link";
import type { ReactNode } from "react";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoLink } from "./Logo";

/** Perfis no X: o oficial do sulco e o de quem fez o site. */
export const X_SITE = "sulcofm";
export const X_AUTHOR = "alcoholicgoatt";

/**
 * Rodapé de todas as páginas: logo e frase, perfis no X em botões com ícone e,
 * numa linha discreta, crédito ao Last.fm (exigido pelos termos) e privacidade.
 */
export async function SiteFooter() {
  const { t, href } = await getI18n();
  return (
    <footer className="border-t border-line px-4 pb-8 pt-8 text-sm text-ink-soft">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoLink />
            <p className="mt-1.5 text-ink-faint">{t.footer.line}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <XPill handle={X_SITE} highlight ariaLabel={t.footer.onX(X_SITE)} />
            <XPill handle={X_AUTHOR} label={t.footer.madeBy} ariaLabel={t.footer.onX(X_AUTHOR, t.footer.madeBy)} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-4 text-xs">
          <FooterLink href="https://www.last.fm" external icon={<NoteIcon />}>
            {t.footer.lastfm}
          </FooterLink>
          <FooterLink href={href("/privacidade")} icon={<LockIcon />}>
            {t.footer.privacy}
          </FooterLink>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Botão arredondado com o ícone do X e o @ do perfil. */
function XPill({
  handle,
  label,
  ariaLabel,
  highlight = false,
}: {
  handle: string;
  label?: string;
  ariaLabel: string;
  highlight?: boolean;
}) {
  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-medium transition active:scale-95 " +
        (highlight
          ? "border-amber/60 text-ink hover:border-amber hover:bg-amber/10"
          : "border-line text-ink-soft hover:border-ink-faint hover:text-ink")
      }
    >
      <XIcon />
      {label && <span className="text-ink-faint">{label}</span>}
      <span>@{handle}</span>
    </a>
  );
}

function FooterLink({
  href,
  external = false,
  icon,
  children,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  const className = "inline-flex items-center gap-1.5 text-ink-faint transition hover:text-ink";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {icon}
      {children}
    </Link>
  );
}

// Ícones em SVG direto no código (sem biblioteca). Decorativos: o texto ao lado já diz o que é.

function XIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
