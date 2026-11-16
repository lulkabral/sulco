/**
 * Filtro do que vai para o Vercel Web Analytics (contagem de visitas, sem cookies).
 * Regra do projeto: nada de username guardado. Então, antes de cada envio:
 * - `/u/NOME` (e qualquer coisa abaixo) vira `/u/[perfil]`;
 * - parâmetros (`?period=...`, `?username=...`) e `#...` são descartados;
 * - quem pediu "não rastrear" ao navegador (Do Not Track ou Global Privacy Control)
 *   não é contado.
 * Funções puras, com teste em analytics.test.ts.
 */

/** Endereço sem nada que identifique a pessoa: só a origem e o caminho, com o username trocado. */
export function sanitizeUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const path = /^\/u\/./.test(parsed.pathname) ? "/u/[perfil]" : parsed.pathname;
  return `${parsed.origin}${path}`;
}

/** A pessoa pediu ao navegador para não ser rastreada? */
export function optedOut(nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean } | undefined): boolean {
  if (!nav) return false;
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}
