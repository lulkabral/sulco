import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PrivateAnalytics } from "@/components/PrivateAnalytics";
import { SiteFooter, X_AUTHOR, X_SITE } from "@/components/SiteFooter";
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

// Endereço oficial do site: completa os endereços absolutos (ex.: da imagem de
// compartilhamento). Sem isso, o Next usava um domínio interno da Vercel que dava 404.
// Se o domínio mudar, troque aqui.
const SITE_URL = "https://sulcofm.vercel.app";

// Nome da marca: sempre em minúsculas (brand/GUIA.md).
const NAME = "sulco";
const TAGLINE = "seu mês em música";
/** Repositório público do projeto (link no rodapé, pedido pela SPEC). */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  // Cartão do link no X: mostra a imagem grande e credita os perfis.
  twitter: {
    card: "summary_large_image",
    site: `@${X_SITE}`,
    creator: `@${X_AUTHOR}`,
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
        <SiteFooter />
        <PrivateAnalytics />
      </body>
    </html>
  );
}
