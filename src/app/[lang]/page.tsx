import { HomeHero } from "@/components/HomeHero";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoLink } from "@/components/Logo";
import { ShowcaseShelf } from "@/components/ShowcaseShelf";
import { getI18n } from "@/i18n/server";
import { getShowcaseCovers } from "@/lib/lastfm/client";

/**
 * Página inicial, direção "Hi-Fi / catálogo de vinil" (docs/MARCA.md): grid arquitetônico
 * com linhas de 1px, tipografia firme e o produto real como protagonista.
 */
export default async function Home() {
  // Vitrine escolhida em src/data/vitrine.json (ou, se faltar capa, os em alta no mundo).
  // As mesmas capas alimentam o palco do hero: o navegador não chama a API do Last.fm.
  const { covers, source, captions } = await getShowcaseCovers();
  const { lang, t } = await getI18n();
  // Legenda escrita em vitrine.json na língua da página; sem ela, a padrão.
  const caption = source === "trending" ? t.home.trendingCaption : captions[lang] || t.home.showcaseCaption;

  return (
    <main id="conteudo" className="flex w-full flex-1 flex-col">
      {/* Barra de catálogo: logo, metadados e língua. */}
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <LogoLink />
          <p className="hidden font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase md:block">
            {t.home.catalogMeta.join(" / ")}
          </p>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl md:border-x md:border-rule">
        <HomeHero covers={covers} />
        <ShowcaseShelf covers={covers} caption={caption} />
      </div>
    </main>
  );
}
