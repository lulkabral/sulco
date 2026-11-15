import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O log de pedidos do `next dev` mostra a URL inteira, com o username.
  // Ignoramos as rotas que carregam username (regra: nada de log com username).
  logging: {
    incomingRequests: { ignore: [/^\/api\/lastfm\//, /^\/u\//] },
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
