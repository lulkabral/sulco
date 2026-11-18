import { Gochi_Hand } from "next/font/google";
import { CoverCollage } from "@/components/CoverCollage";
import { LogoLink } from "@/components/Logo";
import { Marquee } from "@/components/Marquee";
import { UsernameForm } from "@/components/UsernameForm";
import { getI18n } from "@/i18n/server";
import { getShowcaseCovers } from "@/lib/lastfm/client";

// Letra de "bilhete escrito à mão", só para as anotações da página inicial.
const hand = Gochi_Hand({ weight: "400", subsets: ["latin"], display: "swap" });

export default async function Home() {
  // Vitrine escolhida em src/data/vitrine.json (ou, se faltar capa, os em alta no mundo).
  const { covers, source, captions } = await getShowcaseCovers();
  const { lang, t } = await getI18n();
  const hasCollage = covers.length >= 4;
  // Legenda escrita em vitrine.json na língua da página; sem ela, a padrão.
  const caption = source === "trending" ? t.home.trendingCaption : captions[lang] || t.home.showcaseCaption;

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12">
      <header className="py-4">
        <LogoLink />
      </header>

      <div className="flex flex-1 flex-col gap-8 md:grid md:grid-cols-[1fr_1.1fr] md:items-center md:gap-12">
        {/* Colagem primeiro no celular (é o que chama atenção); à direita no computador. */}
        <figure className="md:order-2">
          {hasCollage ? (
            <CoverCollage covers={covers} />
          ) : (
            <div className="flex flex-col gap-2 py-6">
              <Marquee size={72} seconds={70} />
              <Marquee size={72} seconds={90} reverse offset={5} />
            </div>
          )}
          {hasCollage && (
            <figcaption className={`${hand.className} mt-3 -rotate-2 text-lg text-ink`}>↑ {caption}</figcaption>
          )}
        </figure>

        <div className="flex flex-col gap-6 md:order-1">
          <h1 className="text-5xl leading-[0.92] font-extrabold tracking-tighter sm:text-6xl">
            {t.home.titleLine1}
            <br />
            {t.home.titleLine2}{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                aria-hidden
                className="absolute inset-x-[-0.1em] inset-y-[0.02em] -rotate-2 rounded-md bg-amber"
              />
              <span className="relative text-amber-ink">{t.home.titleHighlight}</span>
            </span>
          </h1>

          <p className="max-w-md text-lg text-soft">
            {t.home.intro}
          </p>

          <UsernameForm sticker />


          <details className="text-sm text-soft">
            <summary className="cursor-pointer font-semibold text-ink">{t.home.noLastfm}</summary>
            <p className="mt-2">
              {t.home.noLastfmBefore}{" "}
              <a
                href="https://www.last.fm/join"
                className="text-amber underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                last.fm
              </a>{" "}
              {t.home.noLastfmAfter}
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}
