import { HomeHero } from "@/components/HomeHero";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoLink } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getI18n } from "@/i18n/server";
import { getShowcaseCovers } from "@/lib/lastfm/client";

/**
 * Página inicial ("Loja de discos viva", docs/MARCA.md): modo claro e escuro automáticos,
 * visual musical já na primeira dobra do celular, faixa terracota clicável e palco com o produto real.
 */
export default async function Home() {
  // Vitrine escolhida em src/data/vitrine.json (ou, se faltar capa, os em alta no mundo).
  // As mesmas capas alimentam o topo, a faixa de discos e o palco: o navegador não chama a API do Last.fm.
  const { covers, source, captions } = await getShowcaseCovers();
  const { lang, t } = await getI18n();
  // Legenda escrita em vitrine.json na língua da página; sem ela, a padrão.
  const caption = source === "trending" ? t.home.trendingCaption : captions[lang] || t.home.showcaseCaption;

  return (
    <main id="conteudo" className="flex w-full flex-1 flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-[88rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <HomeHero covers={covers} caption={caption} />
    </main>
  );
}
