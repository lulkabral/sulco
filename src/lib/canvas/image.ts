/**
 * Carrega uma imagem que pode ser desenhada E exportada do canvas.
 *
 * O `crossOrigin = "anonymous"` é obrigatório: sem ele o navegador desenha a capa,
 * mas marca o canvas como "sujo" e bloqueia o PNG. O servidor de imagens do Last.fm
 * responde com `Access-Control-Allow-Origin: *` (ver docs/LASTFM.md).
 *
 * Em caso de erro ou demora maior que `timeoutMs`, devolve null,
 * e quem chamou trata como "álbum sem capa" (uma capa lenta não trava a grade).
 */
export function loadImage(url: string, timeoutMs = 15_000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const done = (result: HTMLImageElement | null) => {
      clearTimeout(timer);
      resolve(result);
    };
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = url;
  });
}

/** Família de fonte do corpo da página (a Geist, carregada pelo next/font). */
export function pageFontFamily(): string {
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/** Espera as fontes da página ficarem prontas, para o canvas não desenhar com a fonte reserva. */
export async function waitForFonts(...families: string[]): Promise<void> {
  if (!document.fonts) return; // sem a API de fontes: desenha com o que houver
  // Cada `load` pode falhar sozinho (ex.: a fonte reserva "Geist Fallback" aponta para
  // uma fonte local que não existe no Linux). Falha de uma não impede esperar as outras.
  await Promise.allSettled(
    families.flatMap((family) => [
      document.fonts.load(`500 16px ${family}`),
      document.fonts.load(`700 16px ${family}`),
      document.fonts.load(`800 16px ${family}`),
    ]),
  );
  await document.fonts.ready;
}
