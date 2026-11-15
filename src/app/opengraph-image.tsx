import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { THEME, TILE_COLORS } from "@/lib/theme";

// Imagem que aparece quando o link do site é colado no WhatsApp, redes etc.
// Identidade "Sala escura": fundo escuro, faixas de peças coloridas (como no topo
// da página inicial), Geist pesada e destaque âmbar. Não depende de usuário.

export const alt = "Recap Mensal: seus artistas, músicas e álbuns mais ouvidos, a partir do Last.fm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Uma faixa de peças: quadrados, discos (vinil) e quadrados com selo, como em Marquee.tsx. */
function Row({ offset, shift }: { offset: number; shift: number }) {
  const tile = 110;
  return (
    <div style={{ display: "flex", gap: 12, marginLeft: shift }}>
      {Array.from({ length: 12 }, (_, i) => {
        const color = TILE_COLORS[(i + offset) % TILE_COLORS.length];
        const shape = (i + offset) % 3;
        return shape === 1 ? (
          <div
            key={i}
            style={{
              width: tile,
              height: tile,
              borderRadius: tile / 2,
              background: "#0d0b09",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: tile * 0.38, height: tile * 0.38, borderRadius: tile, background: color }} />
          </div>
        ) : (
          <div
            key={i}
            style={{
              width: tile,
              height: tile,
              borderRadius: 14,
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shape === 2 && (
              <div style={{ width: tile / 2, height: tile / 2, borderRadius: tile, background: "rgba(0,0,0,0.25)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function Image() {
  // Geist em TTF estático (licença OFL): o gerador não aceita WOFF2 nem fonte variável.
  const [medium, extraBold] = await Promise.all([
    readFile(join(process.cwd(), "assets/Geist-500.ttf")),
    readFile(join(process.cwd(), "assets/Geist-800.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: THEME.room,
          fontFamily: "Geist",
          color: THEME.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 24, opacity: 0.9 }}>
          <Row offset={0} shift={-40} />
          <Row offset={5} shift={-100} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "36px 72px 0" }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
            O que você ouviu
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, color: THEME.amber }}>
            no último mês?
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 30 }}>
            <span style={{ color: THEME.inkSoft, fontWeight: 500 }}>Recap e grade de capas a partir do Last.fm</span>
            <span style={{ fontWeight: 800 }}>Recap Mensal</span>
          </div>
        </div>
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
