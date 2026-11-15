import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem que aparece quando o link do site é colado no WhatsApp, redes etc.
// Gerada uma vez no build (não depende de usuário), no estilo "Encarte" do recap.

export const alt = "Recap Mensal: seus artistas, músicas e álbuns mais ouvidos, a partir do Last.fm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F3EEE4";
const PAPER_DARK = "#E3DACB";
const INK = "#1C1A17";
const INK_SOFT = "#6B655C";
const ACCENT = "#B8432C";

export default async function Image() {
  // Fraunces 600 (licença OFL), em TTF estático: o gerador não aceita WOFF2 nem fonte variável.
  const fraunces = await readFile(join(process.cwd(), "assets/Fraunces-SemiBold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          padding: 72,
          gap: 64,
          alignItems: "center",
        }}
      >
        {/* "Disco" com sombra de papel, como a capa em destaque do recap */}
        <div style={{ display: "flex", position: "relative", width: 360, height: 360 }}>
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              width: 360,
              height: 360,
              background: PAPER_DARK,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 360,
              height: 360,
              border: `3px solid ${INK}`,
              background: INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 150,
                background: "#2A2724",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 96, height: 96, borderRadius: 48, background: ACCENT, display: "flex" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: ACCENT, fontWeight: 700 }}>SEU MÊS EM MÚSICA</div>
          <div style={{ fontFamily: "Fraunces", fontSize: 96, color: INK, lineHeight: 1.05, marginTop: 8 }}>
            Recap Mensal
          </div>
          <div style={{ fontSize: 34, color: INK_SOFT, marginTop: 24, lineHeight: 1.35 }}>
            Seus artistas, músicas e álbuns mais ouvidos de qualquer mês, em uma imagem para
            compartilhar.
          </div>
          <div style={{ display: "flex", height: 3, background: INK, marginTop: 36 }} />
          <div style={{ fontSize: 26, color: INK_SOFT, marginTop: 18 }}>dados: Last.fm</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fraunces, style: "normal", weight: 600 }],
    },
  );
}
