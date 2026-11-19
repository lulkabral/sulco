import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.title, description: t.privacy.description };
}

/** Página de privacidade (SPEC, seção "Privacidade"): curta, direta, sem juridiquês. */
export default async function PrivacyPage() {
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

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">{t.privacy.title}</h1>
          <p className="text-lg text-soft">{t.privacy.summary}</p>
        </div>

        <div className="flex flex-col gap-4">
          {t.privacy.sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-2.5 rounded-[24px] border border-line bg-card p-5 text-ink">
              <h2 className="text-lg font-extrabold tracking-tight">{section.title}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-soft">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-soft">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

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
