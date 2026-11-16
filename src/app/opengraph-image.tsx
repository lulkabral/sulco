import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { THEME, TILE_COLORS } from "@/lib/theme";

// Imagem que aparece quando o link do site é colado no WhatsApp, redes etc.
// Segue o post fixado da marca (brand/post-fixado-1200x675.png): logo "sulco",
// título com a tagline e peças abstratas à direita. Não depende de usuário.

export const alt = "sulco: seu mês em música, em uma imagem. A partir do Last.fm, sem cadastro.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Peça abstrata: quadrado colorido com um círculo (ou um disco), como as da página inicial. */
function Tile({ index }: { index: number }) {
  const side = 170;
  const color = TILE_COLORS[(index * 5) % TILE_COLORS.length];
  const dot = TILE_COLORS[(index * 5 + 7) % TILE_COLORS.length];
  const shape = index % 3;
  return (
    <div
      style={{
        width: side,
        height: side,
        background: color,
        borderRadius: 14,
        display: "flex",
        alignItems: shape === 1 ? "flex-end" : "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {shape === 0 && <div style={{ width: 90, height: 90, borderRadius: 45, background: dot, display: "flex" }} />}
      {shape === 1 && <div style={{ width: 170, height: 85, borderRadius: "85px 85px 0 0", background: dot, display: "flex" }} />}
      {shape === 2 && (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            border: `22px solid ${dot}`,
            display: "flex",
          }}
        />
      )}
    </div>
  );
}

export default async function Image() {
  // Geist em TTF estático (licença OFL) e o símbolo da marca em PNG.
  const [medium, extraBold, symbol] = await Promise.all([
    readFile(join(process.cwd(), "assets/Geist-500.ttf")),
    readFile(join(process.cwd(), "assets/Geist-800.ttf")),
    readFile(join(process.cwd(), "brand/simbolo-800.png")),
  ]);
  const symbolSrc = `data:image/png;base64,${symbol.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: THEME.room,
          fontFamily: "Geist",
          color: THEME.ink,
          padding: "60px 64px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          {/* Logo: o disco é o "S" de "sulco". */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <img src={symbolSrc} width={64} height={64} alt="" style={{ marginRight: 2, marginBottom: 2 }} />
            <span style={{ fontSize: 78, fontWeight: 800, letterSpacing: -4, lineHeight: 0.8 }}>ulco</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02 }}>
              Seu mês em música,
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.08, color: THEME.amber }}>
              em uma imagem.
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 28, color: THEME.inkSoft, fontWeight: 500, lineHeight: 1.45 }}>
              <span>Digite seu usuário do Last.fm.</span>
              <span>Sem cadastro, sem login.</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, width: 354, alignContent: "center" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Tile key={i} index={i} />
          ))}
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
