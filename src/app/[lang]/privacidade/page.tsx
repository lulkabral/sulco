import type { Metadata } from "next";
import Link from "next/link";
import { LogoLink } from "@/components/Logo";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.title, description: t.privacy.description };
}

/** Página de privacidade (SPEC, seção "Privacidade"): curta, direta, sem juridiquês. */
export default async function PrivacyPage() {
  const { t, href } = await getI18n();
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <LogoLink />
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">{t.privacy.title}</h1>
        <p className="text-lg text-soft">{t.privacy.summary}</p>
      </div>

      {t.privacy.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2 text-ink">
          <h2 className="text-xl font-bold">{section.title}</h2>
          {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          {section.list && (
            <ul className="list-disc space-y-1 pl-5">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p>
        <Link href={href("/")} className="font-medium text-amber underline underline-offset-2">
          {t.common.backHome}
        </Link>
      </p>
    </main>
  );
}
