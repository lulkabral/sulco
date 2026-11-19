// Logo "sulco" desenhado direto no canvas (para assinar as imagens geradas).
// Os traços são os mesmos de brand/simbolo.svg (caixa de 400 x 400): desenhar em vez de
// carregar o arquivo deixa o logo nítido em qualquer tamanho e não precisa esperar download.

const AMBER = "#E8A13A";
const ROOM = "#15120F";

/** Parte da caixa de 400 px ocupada pelo círculo do disco (de 10 a 390). */
const DISC_IN_BOX = 380 / 400;
/** Altura do "l" da Plus Jakarta Sans 800, em fração do tamanho da fonte (medido: 0,766). */
const L_HEIGHT = 0.766;

/** Desenha o disco-S numa caixa quadrada de lado `size`, com o canto superior em (x, y). */
export function drawSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 400;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Disco âmbar.
  ctx.beginPath();
  ctx.arc(200, 200, 190, 0, Math.PI * 2);
  ctx.fillStyle = AMBER;
  ctx.fill();

  // Sulcos e brilho, recortados no disco. Em tamanho pequeno somem, e sobra o S limpo.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(21,18,15,0.26)";
  ctx.lineWidth = 2.28;
  for (let r = 57; r <= 177; r += 17.1) {
    ctx.beginPath();
    ctx.arc(200, 200, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,243,214,0.30)";
  ctx.fill(new Path2D("M 200 200 L 328.7 35.3 L 384.5 101.9 Z"));
  ctx.fill(new Path2D("M 200 200 L 71.3 364.7 L 15.5 298.1 Z"));
  ctx.restore();

  // O "S": um sulco cortando o disco.
  ctx.strokeStyle = ROOM;
  ctx.lineWidth = 44.71;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M 282.27 57.50 A 95.00 95.00 0 1 0 200.00 200.00 A 95.00 95.00 0 1 1 117.73 342.50"));

  // Furo central com pino.
  ctx.fillStyle = ROOM;
  ctx.beginPath();
  ctx.arc(200, 200, 29.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(200, 200, 10.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Tamanho da caixa do símbolo para o disco ter a altura do "l" numa fonte de `fontPx`. */
export function symbolBoxFor(fontPx: number): number {
  return (fontPx * L_HEIGHT) / DISC_IN_BOX;
}

/** Largura total do logo (disco + "ulco") numa fonte de `fontPx`. */
export function wordmarkWidth(ctx: CanvasRenderingContext2D, fontPx: number, font: string): number {
  ctx.font = `800 ${fontPx}px ${font}`;
  ctx.letterSpacing = `${-fontPx * 0.05}px`;
  const w = ctx.measureText("ulco").width;
  ctx.letterSpacing = "0px";
  return symbolBoxFor(fontPx) + w;
}

/**
 * Logo completo: disco (o "S") + "ulco" em Plus Jakarta Sans 800, com o disco da altura do "l"
 * apoiado na linha de base `baseline`. `x` é a borda esquerda. Devolve a largura usada.
 */
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  fontPx: number,
  font: string,
  inkColor: string,
): number {
  const box = symbolBoxFor(fontPx);
  // O círculo vai de 10 a 390 na caixa: a base dele (390) fica na linha de base.
  drawSymbol(ctx, x, baseline - box * (390 / 400), box);
  ctx.font = `800 ${fontPx}px ${font}`;
  ctx.fillStyle = inkColor;
  ctx.textAlign = "left";
  ctx.letterSpacing = `${-fontPx * 0.05}px`;
  ctx.fillText("ulco", x + box, baseline);
  const w = ctx.measureText("ulco").width;
  ctx.letterSpacing = "0px";
  return box + w;
}
