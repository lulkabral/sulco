import { Marquee } from "@/components/Marquee";
import { UsernameForm } from "@/components/UsernameForm";

const STEPS = [
  { n: 1, title: "Digite o username", text: "do seu Last.fm" },
  { n: 2, title: "Escolha o período", text: "uma semana ou um mês fechado" },
  { n: 3, title: "Baixe a imagem", text: "recap ou grade de capas" },
];

export default function Home() {
  return (
    <main id="conteudo" className="flex flex-1 flex-col">
      {/* Faixas abstratas: ainda não há usuário, então não há capas para mostrar. */}
      <div className="flex flex-col gap-2 pt-4">
        <Marquee size={72} seconds={70} />
        <Marquee size={72} seconds={90} reverse offset={5} />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 motion-safe:animate-rise">
          <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            O que você ouviu <span className="text-amber">no último mês?</span>
          </h1>
          <p className="text-lg text-ink-soft">
            Seus artistas, músicas, álbuns e gêneros mais ouvidos, numa imagem pronta para
            compartilhar. Basta o username do Last.fm, sem cadastro.
          </p>
        </div>

        <div className="motion-safe:animate-rise [animation-delay:100ms]">
          <UsernameForm />
        </div>

        <ol className="grid grid-cols-3 gap-2 motion-safe:animate-rise [animation-delay:200ms]">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl bg-card p-3">
              <span className="text-xl font-extrabold text-amber">{s.n}</span>
              <p className="mt-1 text-sm font-semibold leading-tight">{s.title}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>

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
    </main>
  );
}
