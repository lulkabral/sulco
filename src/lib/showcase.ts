/**
 * Vitrine da página inicial: os álbuns escolhidos a dedo em src/data/vitrine.json
 * (como o banner do X). Confira com `npm run vitrine` antes de publicar.
 * Função pura, com teste em showcase.test.ts.
 */

/** A colagem tem 6 lugares. */
export const SHOWCASE_MAX = 6;

export type ShowcaseItem = { artist: string; album: string };
/** `caption`: legenda em português; `captionEn`/`captionEs`: opcionais (sem elas, vale a padrão de cada língua). */
export type Showcase = { caption: string; captionEn: string; captionEs: string; items: ShowcaseItem[] };

/** Lê e limpa o JSON da vitrine. Item sem artista ou sem álbum fica de fora; passa de 6, corta. */
export function parseShowcase(data: unknown): Showcase {
  const d = (data ?? {}) as { legenda?: unknown; legenda_en?: unknown; legenda_es?: unknown; itens?: unknown };
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const items = (Array.isArray(d.itens) ? d.itens : [])
    .map((it) => {
      const o = (it ?? {}) as { artista?: unknown; album?: unknown };
      return {
        artist: typeof o.artista === "string" ? o.artista.trim() : "",
        album: typeof o.album === "string" ? o.album.trim() : "",
      };
    })
    .filter((it) => it.artist !== "" && it.album !== "")
    .slice(0, SHOWCASE_MAX);
  return { caption: text(d.legenda), captionEn: text(d.legenda_en), captionEs: text(d.legenda_es), items };
}
