// Logo "sulco" desenhado direto no canvas (para assinar as imagens geradas).
// Mesmo desenho de public/brand/simbolo.svg (src/lib/brand-symbol.ts): disco âmbar com o "s"
// da DM Sans 800 em contorno. Desenhar em vez de carregar o arquivo deixa o logo nítido em
// qualquer tamanho e não espera download. O "ulco" usa a fonte da página, que quem chama
// já esperou carregar (waitForFonts) antes de desenhar.

import {
  LOCKUP,
  SYMBOL_AMBER,
  SYMBOL_CENTER,
  SYMBOL_DARK,
  SYMBOL_HOLE_RADIUS,
  SYMBOL_MINI_BELOW_PX,
  SYMBOL_RADIUS,
  SYMBOL_RING_RADIUS,
  SYMBOL_S_PATH,
} from "@/lib/brand-symbol";

/**
 * Desenha o símbolo com o disco de diâmetro `diameter` e o canto superior do disco em (x, y).
 * Abaixo de 32 px (já contando a escala do canvas) sai a versão mini, sem o furo central.
 */
export function drawSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, diameter: number) {
  const s = diameter / (SYMBOL_RADIUS * 2);
  const realPx = diameter * ctx.getTransform().a;
  ctx.save();
  // A caixa do SVG tem 200 de lado e o disco começa em 4 (100 - 96).
  ctx.translate(x - (SYMBOL_CENTER - SYMBOL_RADIUS) * s, y - (SYMBOL_CENTER - SYMBOL_RADIUS) * s);
  ctx.scale(s, s);

  ctx.fillStyle = SYMBOL_AMBER;
  ctx.beginPath();
  ctx.arc(SYMBOL_CENTER, SYMBOL_CENTER, SYMBOL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SYMBOL_DARK;
  ctx.fill(new Path2D(SYMBOL_S_PATH));

  if (realPx >= SYMBOL_MINI_BELOW_PX) {
    ctx.beginPath();
    ctx.arc(SYMBOL_CENTER, SYMBOL_CENTER, SYMBOL_RING_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SYMBOL_AMBER;
    ctx.beginPath();
    ctx.arc(SYMBOL_CENTER, SYMBOL_CENTER, SYMBOL_HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Mede o "ulco" em DM Sans 800 com o letter-spacing do lockup. */
function measureUlco(ctx: CanvasRenderingContext2D, fontPx: number, font: string): number {
  ctx.font = `800 ${fontPx}px ${font}`;
  ctx.letterSpacing = `${fontPx * LOCKUP.letterSpacing}px`;
  const w = ctx.measureText("ulco").width;
  ctx.letterSpacing = "0px";
  return w;
}

/** Largura total do logo (disco + espaço + "ulco") numa fonte de `fontPx`. */
export function wordmarkWidth(ctx: CanvasRenderingContext2D, fontPx: number, font: string): number {
  return fontPx * (LOCKUP.disc + LOCKUP.gap) + measureUlco(ctx, fontPx, font);
}

/**
 * Logo completo: disco (o "s") + "ulco" em DM Sans 800, com as proporções do lockup
 * (docs/MARCA.md): disco de 0,787em, base 0,063em abaixo da linha de base `baseline`
 * (o topo cai no topo do "l"), 0,01em até o "u". `x` é a borda esquerda. Devolve a largura.
 */
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  fontPx: number,
  font: string,
  inkColor: string,
): number {
  const disc = fontPx * LOCKUP.disc;
  drawSymbol(ctx, x, baseline + fontPx * LOCKUP.belowBaseline - disc, disc);
  const textX = x + disc + fontPx * LOCKUP.gap;
  ctx.font = `800 ${fontPx}px ${font}`;
  ctx.fillStyle = inkColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = `${fontPx * LOCKUP.letterSpacing}px`;
  ctx.fillText("ulco", textX, baseline);
  const w = ctx.measureText("ulco").width;
  ctx.letterSpacing = "0px";
  return textX - x + w;
}
