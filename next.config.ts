import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O log de pedidos do `next dev` mostra a URL inteira, com o username.
  // Ignoramos as rotas que carregam username (regra: nada de log com username).
  logging: {
    // /u(\/|\?|$): pega /u/NOME e também /u?username=NOME (formulário sem JavaScript).
    incomingRequests: { ignore: [/^\/api\/lastfm\//, /^\/u(\/|\?|$)/] },
  },
  // next/image só aceita imagens do servidor de imagens do Last.fm (nada de proxy aberto).
  images: {
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
