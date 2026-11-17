import { Gochi_Hand } from "next/font/google";
import { CoverCollage } from "@/components/CoverCollage";
import { LogoLink } from "@/components/Logo";
import { Marquee } from "@/components/Marquee";
import { UsernameForm } from "@/components/UsernameForm";
import { getShowcaseCovers } from "@/lib/lastfm/client";

// Letra de "bilhete escrito à mão", só para as anotações da página inicial.
const hand = Gochi_Hand({ weight: "400", subsets: ["latin"], display: "swap" });

/** Dia em que o site foi ao ar: a "edição" do dia conta a partir daqui. */
const LAUNCH_DAY = Date.UTC(2026, 10, 16);

/** "nº 2 · 17 nov": número da edição (um por dia desde o lançamento) e a data. */
function editionLabel(timestamp: number): string {
  const n = Math.max(1, Math.floor((timestamp - LAUNCH_DAY) / 86_400_000) + 1);
  const date = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" })
    .format(timestamp)
    .replace(" de ", " ")
    .replace(".", "");
  return `nº ${n} · ${date}`;
}

export default async function Home() {
  // Vitrine escolhida em src/data/vitrine.json (ou, se faltar capa, os em alta no mundo).
  const { covers, caption, updatedAt } = await getShowcaseCovers();
  const hasCollage = covers.length >= 4;

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12">
      <header className="flex items-center justify-between py-4">
        <LogoLink />
        <span className="font-mono text-xs text-ink-faint">{editionLabel(updatedAt)}</span>
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
            o que tocou
            <br />
            no{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                aria-hidden
                className="absolute inset-x-[-0.1em] inset-y-[0.02em] -rotate-2 rounded-md bg-amber"
              />
              <span className="relative text-amber-ink">seu mês?</span>
            </span>
          </h1>

          <p className="max-w-md text-lg text-ink-soft">
            Seus artistas, músicas, álbuns e gêneros mais ouvidos, numa imagem para postar.
          </p>

          <UsernameForm sticker />


          <details className="text-sm text-ink-soft">
            <summary className="cursor-pointer font-semibold text-ink">Não tem Last.fm?</summary>
            <p className="mt-2">
              Crie uma conta grátis em{" "}
              <a
                href="https://www.last.fm/join"
                className="text-amber underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                last.fm
              </a>{" "}
              e ligue o scrobbling no seu app de música (Spotify, Deezer, YouTube Music e outros) nas
              configurações do Last.fm. A partir daí, tudo que você ouvir passa a contar.
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}
