import type { Metadata } from "next";
import type { Viewport } from "next";
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

const DESCRIPTION =
  "Veja seus artistas, músicas, álbuns e gêneros mais ouvidos de qualquer mês e baixe uma imagem pronta para compartilhar. Basta o username do Last.fm.";

// Na Vercel, o Next completa os endereços absolutos (ex.: da imagem de compartilhamento)
// com o domínio do projeto sozinho; por isso não fixamos `metadataBase` aqui.
// Nome da marca: sempre em minúsculas (brand/GUIA.md).
const NAME = "sulco";
const TAGLINE = "seu mês em música";

export const metadata: Metadata = {
  applicationName: NAME,
  title: { default: `${NAME} · ${TAGLINE}`, template: `%s · ${NAME}` },
  description: DESCRIPTION,
  openGraph: {
    siteName: NAME,
    title: `${NAME} · ${TAGLINE}`,
    description: DESCRIPTION,
    locale: "pt_BR",
    type: "website",
  },
};

/** Cor da barra do navegador no celular, igual ao fundo do site. */
export const viewport: Viewport = {
  themeColor: "#15120f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-room text-ink">
        {/* Primeiro item do Tab: pula direto para o conteúdo (some até receber foco). */}
        <a
          href="#conteudo"
          className="sr-only rounded-lg bg-amber px-4 py-2 font-semibold text-amber-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Pular para o conteúdo
        </a>
        {children}
        <footer className="border-t border-line px-4 py-6 text-sm text-ink-soft">
          <div className="mx-auto flex max-w-5xl flex-col justify-between gap-2 sm:flex-row">
            <p>
              <Link href="/" className="font-extrabold tracking-tight text-ink hover:text-amber">
                {NAME}
              </Link>{" "}
              · {TAGLINE} · sem cadastro, gerado no seu aparelho ·{" "}
              <Link href="/privacidade" className="underline underline-offset-2 hover:text-ink">
                Privacidade
              </Link>
            </p>
            <p>
              Dados:{" "}
              <a
                href="https://www.last.fm"
                className="underline underline-offset-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Last.fm
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
