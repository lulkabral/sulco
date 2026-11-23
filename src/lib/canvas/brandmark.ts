// Logo "sulco" desenhado direto no canvas (para assinar as imagens geradas).
// Mesmos desenhos de brand/logo-2026-11/ (src/lib/brand-symbol.ts): o símbolo sozinho
// (simbolo.svg) e o logo completo (lockup-currentcolor.svg), com o "s" do mesmo tamanho e
// na mesma linha de base de "ulco". Desenhar os contornos em vez de carregar o arquivo deixa
// o logo nítido em qualquer tamanho e não depende de download nem da fonte.

import {
  LOCKUP,
  LOCKUP_SVG,
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

/** Largura total do logo (disco + "ulco") para um "ulco" de `fontPx`. */
export function wordmarkWidth(_ctx: CanvasRenderingContext2D, fontPx: number): number {
  return (LOCKUP_SVG.width * fontPx) / LOCKUP_SVG.em;
}

/**
 * Logo completo (lockup) com o "ulco" do tamanho `fontPx` e a linha de base em `baseline`:
 * disco de 0,936em com a base 0,209em abaixo da linha de base (linha das descendentes), o "s"
 * do mesmo tamanho e na mesma linha de "ulco". `x` é a borda esquerda; "ulco" sai em `inkColor`.
 * Devolve a largura usada.
 */
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  fontPx: number,
  _font: string,
  inkColor: string,
): number {
  const L = LOCKUP_SVG;
  const k = fontPx / L.em;
  // A caixa do desenho vai do topo do disco à base dele (a linha das descendentes).
  const top = baseline + fontPx * LOCKUP.belowBaseline - L.height * k;
  const realDisc = L.disc.r * 2 * k * ctx.getTransform().a;
  ctx.save();
  ctx.translate(x, top);
  ctx.scale(k, k);

  ctx.fillStyle = SYMBOL_AMBER;
  ctx.beginPath();
  ctx.arc(L.disc.cx, L.disc.cy, L.disc.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = SYMBOL_DARK;
  ctx.fill(new Path2D(L.sPath));

  if (realDisc >= SYMBOL_MINI_BELOW_PX) {
    ctx.beginPath();
    ctx.arc(L.disc.cx, L.disc.cy, L.ringRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SYMBOL_AMBER;
    ctx.beginPath();
    ctx.arc(L.disc.cx, L.disc.cy, L.holeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = inkColor;
  ctx.fill(new Path2D(L.ulcoPath));
  ctx.restore();
  return L.width * k;
}
