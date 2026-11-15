import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "O que o Recap Mensal faz (e não faz) com os seus dados.",
};

/** Página de privacidade (SPEC, seção "Privacidade"): curta, direta, sem juridiquês. */
export default function PrivacyPage() {
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacidade</h1>
        <p className="text-lg text-ink-soft">
          Resumo: o site só precisa do seu username do Last.fm, lê apenas o que já é público no
          seu perfil e não guarda nada sobre você.
        </p>
      </div>

      <Section title="O que o site recebe">
        <p>
          Só o username do Last.fm que você digita. Ele já é público: qualquer pessoa pode abrir{" "}
          <span className="whitespace-nowrap">last.fm/user/seu-username</span>.
        </p>
      </Section>

      <Section title="O que o site lê">
        <p>
          Apenas dados públicos do seu perfil no Last.fm: as músicas, os artistas e os álbuns que
          você ouviu (os scrobbles), o total de scrobbles e a foto do perfil. O site não se conecta
          ao Spotify nem a nenhum outro serviço de streaming, e não pede senha.
        </p>
      </Section>

      <Section title="O que o site não tem">
        <ul className="list-disc space-y-1 pl-5">
          <li>Cadastro, login ou senha.</li>
          <li>Banco de dados.</li>
          <li>Cookies de rastreio, anúncios ou ferramentas de análise de visitas.</li>
          <li>Histórico do que cada pessoa pesquisou.</li>
        </ul>
      </Section>

      <Section title="O que fica guardado, e por quanto tempo">
        <p>
          Para não sobrecarregar o Last.fm, as respostas dele ficam guardadas temporariamente
          (cache): de 10 minutos a 1 dia, conforme o tipo de dado, e até 7 dias no caso das tags
          de artistas. Esse cache guarda a resposta do Last.fm, sem ligação com quem pediu.
        </p>
        <p>
          A empresa que hospeda o site (Vercel) mantém, por pouco tempo, registros técnicos de
          acesso, como o endereço da página visitada. Como o username faz parte do endereço
          (ex.: /u/seu-username), ele pode aparecer nesses registros. O site em si não grava
          nenhum registro com username.
        </p>
      </Section>

      <Section title="Onde as imagens são criadas">
        <p>
          O recap e a grade de álbuns são desenhados no seu próprio aparelho, pelo navegador. A
          imagem não é enviada para o nosso servidor; ela só sai do aparelho se você baixar ou
          compartilhar.
        </p>
      </Section>

      <Section title="Projeto não comercial">
        <p>
          Os dados vêm do{" "}
          <a href="https://www.last.fm" className="underline" target="_blank" rel="noopener noreferrer">
            Last.fm
          </a>
          , de acordo com os termos de uso da API deles. O site não tem vínculo com o Last.fm nem
          com o Spotify.
        </p>
      </Section>

      <p>
        <Link href="/" className="font-medium text-amber underline underline-offset-2">
          Voltar ao início
        </Link>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 text-ink">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
