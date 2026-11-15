import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serifada dos títulos da imagem do recap (direção visual "Encarte").
// Só a variável CSS fica na página; o canvas lê o nome da família por ela.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Veja seus artistas, músicas, álbuns e gêneros mais ouvidos de qualquer mês e baixe uma imagem pronta para compartilhar. Basta o username do Last.fm.";

// Na Vercel, o Next completa os endereços absolutos (ex.: da imagem de compartilhamento)
// com o domínio do projeto sozinho; por isso não fixamos `metadataBase` aqui.
export const metadata: Metadata = {
  title: { default: "Recap Mensal", template: "%s · Recap Mensal" },
  description: DESCRIPTION,
  openGraph: {
    siteName: "Recap Mensal",
    title: "Recap Mensal",
    description: DESCRIPTION,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Primeiro item do Tab: pula direto para o conteúdo (some até receber foco). */}
        <a
          href="#conteudo"
          className="sr-only rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        {children}
        <footer className="border-t border-zinc-200 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <div className="mx-auto flex max-w-5xl flex-col gap-2">
            <p>
              Sem cadastro e sem guardar o que você pesquisa. As imagens são geradas no seu
              aparelho.{" "}
              <Link href="/privacidade" className="underline">
                Privacidade
              </Link>
            </p>
            <p>
              Dados:{" "}
              <a href="https://www.last.fm" className="underline" target="_blank" rel="noopener noreferrer">
                Last.fm
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
