import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { getShowcaseCovers } from "@/lib/lastfm/client";
import { coverUrl } from "@/lib/grid/layout";
import { THEME, TILE_COLORS } from "@/lib/theme";

// Imagem que aparece quando o link do site é colado no X, WhatsApp etc.
// É um pedaço da página inicial: título com o marca-texto âmbar e a colagem com as capas
// da vitrine (src/data/vitrine.json). Não depende de usuário.
// O canto de baixo à esquerda fica vazio: o X põe ali a etiqueta com o nome do site.

export const alt = "sulco: o que tocou no seu mês? Colagem de capas de álbuns e o convite para gerar o seu recap a partir do Last.fm.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Mesma colagem da página inicial (CoverCollage): [esquerda, topo, largura, giro, fita?] em %. */
const SLOTS: [number, number, number, number, boolean][] = [
  [1, 7, 34, -8, false],
  [29, 0, 38, 5, true],
  [65, 9, 32, -4, false],
  [6, 47, 33, 4, true],
  [37, 43, 36, -6, false],
  [70, 50, 28, 7, true],
];
const BOX = { left: 618, top: 96, width: 556, height: 417 }; // 4:3, como na página
const IMAGE_HOSTS = /^https:\/\/lastfm(?:-img)?\.freetls\.fastly\.net\//;

/**
 * Capas da vitrine já baixadas (como data URL), guardadas por um dia.
 * Só busca no servidor de imagens do Last.fm (regra 5); capa que falhar fica de fora.
 */
async function showcaseImages(): Promise<string[]> {
  "use cache";
  const { covers } = await getShowcaseCovers();
  const images = await Promise.all(
    covers.slice(0, SLOTS.length).map(async (c) => {
      const url = coverUrl(c.imageUrl, 300);
      if (!IMAGE_HOSTS.test(url)) return null;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const type = res.headers.get("content-type") ?? "";
        if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return null;
        const data = Buffer.from(await res.arrayBuffer()).toString("base64");
        return `data:${type};base64,${data}`;
      } catch {
        return null;
      }
    }),
  );
  const ok = images.filter((i): i is string => i !== null);
  // Faltou capa: tenta de novo logo; tudo certo: guarda por um dia (a vitrine muda pouco).
  cacheLife(ok.length >= 4 ? { revalidate: 86_400, expire: 604_800 } : { revalidate: 300, expire: 900 });
  return ok;
}

/** Peça abstrata (quadrado com círculo), para quando as capas não vierem. */
function Tile({ index, side }: { index: number; side: number }) {
  const color = TILE_COLORS[(index * 5) % TILE_COLORS.length];
  const dot = TILE_COLORS[(index * 5 + 7) % TILE_COLORS.length];
  return (
    <div style={{ width: side, height: side, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: side / 2, height: side / 2, borderRadius: side, background: dot, display: "flex" }} />
    </div>
  );
}

export default async function Image() {
  // Geist em TTF estático (licença OFL) e o símbolo da marca em PNG.
  const [medium, extraBold, symbol, covers] = await Promise.all([
    readFile(join(process.cwd(), "assets/Geist-500.ttf")),
    readFile(join(process.cwd(), "assets/Geist-800.ttf")),
    readFile(join(process.cwd(), "brand/simbolo-800.png")),
    showcaseImages().catch(() => [] as string[]),
  ]);
  const symbolSrc = `data:image/png;base64,${symbol.toString("base64")}`;
  const useCovers = covers.length >= 4;
  const pieces = useCovers ? covers : [0, 1, 2, 3, 4, 5];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: THEME.room,
          fontFamily: "Geist",
          color: THEME.ink,
        }}
      >
        {/* Texto: logo no alto, título e uma linha. Termina antes do canto de baixo. */}
        <div style={{ position: "absolute", left: 64, top: 56, width: 520, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <img src={symbolSrc} width={52} height={52} alt="" style={{ marginRight: 2, marginBottom: 1 }} />
            <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: -3, lineHeight: 0.8 }}>ulco</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 72, fontSize: 86, fontWeight: 800, letterSpacing: -4, lineHeight: 0.98 }}>
            <span>o que tocou</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>no</span>
              {/* Marca-texto âmbar torto atrás de "seu mês?", como na página. */}
              <div style={{ display: "flex", position: "relative", marginLeft: 34 }}>
                <div
                  style={{
                    position: "absolute",
                    left: -10,
                    right: -10,
                    top: 6,
                    bottom: 0,
                    background: THEME.amber,
                    borderRadius: 10,
                    transform: "rotate(-2deg)",
                    display: "flex",
                  }}
                />
                <span style={{ color: THEME.amberInk, paddingBottom: 4 }}>seu mês?</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 30, fontSize: 28, fontWeight: 500, lineHeight: 1.35, color: THEME.inkSoft, display: "flex" }}>
            Seus artistas, músicas, álbuns e gêneros mais ouvidos, numa imagem para postar.
          </div>
        </div>

        {/* Colagem: capas "impressas" com borda, coladas tortas com fita. */}
        {pieces.map((piece, i) => {
          const [left, top, width, rotate, tape] = SLOTS[i];
          const side = Math.round((BOX.width * width) / 100);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: BOX.left + (BOX.width * left) / 100,
                top: BOX.top + (BOX.height * top) / 100,
                width: side,
                height: side,
                display: "flex",
                transform: `rotate(${rotate}deg)`,
                border: `5px solid ${THEME.ink}`,
                background: THEME.card,
                boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
              }}
            >
              {typeof piece === "string" ? (
                <img src={piece} width={side - 10} height={side - 10} alt="" style={{ objectFit: "cover" }} />
              ) : (
                <Tile index={piece} side={side - 10} />
              )}
              {tape && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: side / 2 - 44,
                    width: 88,
                    height: 26,
                    background: "rgba(244,238,230,0.78)",
                    transform: "rotate(-12deg)",
                    display: "flex",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: medium, style: "normal", weight: 500 },
        { name: "Geist", data: extraBold, style: "normal", weight: 800 },
      ],
    },
  );
}
