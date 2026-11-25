import type { Metadata } from "next";
import type { Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { PrivateAnalytics } from "@/components/PrivateAnalytics";
import { SiteFooter, X_AUTHOR, X_SITE } from "@/components/SiteFooter";
import { LocaleProvider } from "@/i18n/client";
import { HTML_LANG, LOCALES, OG_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme-mode";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

// Fonte única da interface (textos, títulos e números com tabular-nums). O canvas usa a mesma fonte.
const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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

/** Cor da barra do navegador no celular, acompanhando o tema claro ou escuro. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4EEE3" },
    { media: "(prefers-color-scheme: dark)", color: "#14110E" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { lang, t } = await getI18n();
  return (
    <html
      lang={HTML_LANG[lang]}
      suppressHydrationWarning
      className={`${sans.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://lastfm-img.freetls.fastly.net" />
        <link rel="preconnect" href="https://lastfm-img.freetls.fastly.net" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-room text-ink">
        <LocaleProvider lang={lang}>
          {/* Primeiro item do Tab: pula direto para o conteúdo (some até receber foco). */}
          <a
            href="#conteudo"
            className="sr-only rounded-full bg-cta px-4 py-2 font-semibold text-cta-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
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
