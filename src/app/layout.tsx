import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Recap Mensal",
  description: "Seu recap do mês a partir do Last.fm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
