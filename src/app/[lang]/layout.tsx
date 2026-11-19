import type { Metadata } from "next";
import type { Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { PrivateAnalytics } from "@/components/PrivateAnalytics";
import { SiteFooter, X_AUTHOR, X_SITE } from "@/components/SiteFooter";
import { LocaleProvider } from "@/i18n/client";
import { HTML_LANG, LOCALES, OG_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { THEME } from "@/lib/theme";
import "../globals.css";

// Interface e títulos (docs/MARCA.md). O canvas do recap e da grade usa a mesma fonte.
const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Números, datas e metadados (sempre com tabular-nums).
const mono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Endereço oficial do site: completa os endereços absolutos (ex.: da imagem de
// compartilhamento). Sem isso, o Next usava um domínio interno da Vercel que dava 404.
// Se o domínio mudar, troque aqui.
const SITE_URL = "https://www.sulcofm.com.br";

// Nome da marca: sempre em minúsculas (brand/GUIA.md).
const NAME = "sulco";

/** As três línguas são geradas na publicação (pt fica sem prefixo no endereço: src/proxy.ts). */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: NAME,
    title: { default: `${NAME} · ${t.meta.tagline}`, template: `%s · ${NAME}` },
    description: t.meta.description,
    openGraph: {
      siteName: NAME,
      title: `${NAME} · ${t.meta.tagline}`,
      description: t.meta.description,
      locale: OG_LOCALE[lang],
      type: "website",
      // Prévia do link na língua da página (src/app/og/[lang]/route.tsx).
      images: [{ url: `/og/${lang}`, width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    // Cartão do link no X: mostra a imagem grande e credita os perfis.
    twitter: {
      card: "summary_large_image",
      images: [{ url: `/og/${lang}`, alt: t.meta.ogAlt }],
      site: `@${X_SITE}`,
      creator: `@${X_AUTHOR}`,
    },
  };
}

/** Cor da barra do navegador no celular, igual ao fundo do site. */
export const viewport: Viewport = {
  themeColor: THEME.room,
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { lang, t } = await getI18n();
  return (
    <html lang={HTML_LANG[lang]} className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-room text-ink">
        <LocaleProvider lang={lang}>
          {/* Primeiro item do Tab: pula direto para o conteúdo (some até receber foco). */}
          <a
            href="#conteudo"
            className="sr-only rounded-lg bg-amber px-4 py-2 font-semibold text-amber-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            {t.common.skipToContent}
          </a>
          {children}
          <SiteFooter />
        </LocaleProvider>
        <PrivateAnalytics />
      </body>
    </html>
  );
}
