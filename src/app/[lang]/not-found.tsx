import type { Metadata } from "next";
import Link from "next/link";
import { LogoLink } from "@/components/Logo";
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
    <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <LogoLink />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-widest text-amber">{t.notFound.eyebrow}</p>
        <h1 className="text-4xl font-extrabold tracking-tight">{t.notFound.heading}</h1>
        <p className="text-ink-soft">{t.notFound.body}</p>
      </div>
      <UsernameForm />
      <p>
        <Link href={href("/")} className="font-medium text-amber underline underline-offset-2">
          {t.common.backHome}
        </Link>
      </p>
    </main>
  );
}
