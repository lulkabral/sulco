// Cor dominante de uma capa já carregada (no navegador).

import { dominantColor, paletteFromColor, type Palette } from "./palettes";

/**
 * Reduz a capa para 24x24 px, lê os pixels e monta a paleta "Cor da capa".
 * A capa foi carregada com CORS (ver loadImage), então dá para ler os pixels.
 * Se o navegador recusar a leitura, devolve null e a imagem fica com a paleta padrão.
 */
export function paletteFromCover(img: HTMLImageElement): Palette | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 24, 24);
    return paletteFromColor(dominantColor(ctx.getImageData(0, 0, 24, 24).data));
  } catch {
    return null;
  }
}
