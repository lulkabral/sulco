import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UsernameForm } from "@/components/UsernameForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.notFound.title };
}

/** 404: endereço que não existe no site. */
export default async function NotFound() {
  const { t, href } = await getI18n();
  return (
    <main id="conteudo" className="flex w-full flex-1 flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs font-semibold tracking-[0.16em] text-terra-text uppercase">{t.notFound.eyebrow}</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t.notFound.heading}</h1>
          <p className="text-soft">{t.notFound.body}</p>
        </div>
        <UsernameForm />
        <p>
          <Link
            href={href("/")}
            className="font-semibold text-terra-text underline underline-offset-4 transition-opacity duration-200 ease-smooth hover:opacity-80"
          >
            ← {t.common.backHome}
          </Link>
        </p>
      </div>
    </main>
  );
}
