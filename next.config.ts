import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O log de pedidos do `next dev` mostra a URL inteira, com o username.
  // Ignoramos as rotas que carregam username (regra: nada de log com username).
  logging: {
    // /u(\/|\?|$): pega /u/NOME e também /u?username=NOME (formulário sem JavaScript),
    // com ou sem língua na frente (/en/u/NOME).
    incomingRequests: { ignore: [/^\/api\/lastfm\//, /^(\/(pt|en|es))?\/u(\/|\?|$)/] },
  },
  images: {
    // Imagens vão direto do servidor do Last.fm (já em miniatura, ver `thumbUrl`), sem
    // passar pelo otimizador da Vercel: o plano grátis tem cota mensal pequena de
    // otimizações, e cada capa de cada usuário novo gastava uma.
    unoptimized: true,
    // Se um dia voltar a otimizar: só o servidor de imagens do Last.fm (nada de proxy aberto).
    remotePatterns: [
      { protocol: "https", hostname: "lastfm-img.freetls.fastly.net", pathname: "/i/u/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
