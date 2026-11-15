import { UsernameForm } from "@/components/UsernameForm";

export default function Home() {
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">Recap Mensal</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Veja seus artistas, músicas e álbuns mais ouvidos de qualquer período e baixe uma imagem
          pronta para compartilhar. Basta o seu username do Last.fm.
        </p>
      </div>

      <UsernameForm />

      <details className="text-sm text-zinc-600 dark:text-zinc-400">
        <summary className="cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
          Não tem Last.fm?
        </summary>
        <p className="mt-2">
          Crie uma conta grátis em{" "}
          <a href="https://www.last.fm/join" className="underline" target="_blank" rel="noopener noreferrer">
            last.fm
          </a>{" "}
          e ligue o scrobbling no seu app de música (Spotify, Deezer, YouTube Music e outros) nas
          configurações do Last.fm. A partir daí, tudo que você ouvir passa a contar.
        </p>
      </details>
    </main>
  );
}
