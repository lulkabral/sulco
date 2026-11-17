import { INTL_LOCALE } from "@/i18n/config";
import { DICTS } from "@/i18n";
// Formato "Lineup": pôster de festival. O artista mais ouvido é a atração principal,
// enorme; os outros vêm em andares cada vez menores. Embaixo, 3 capas redondas.

import type { RecapData, RecapOptions } from "../draw";
import { cover, eyebrow, fitFontSize, footer, hexAlpha, INNER, measureWith, text, W, type Ctx } from "../helpers";
import { lineupTiers, packNames, TIER_SIZES } from "../tiers";
import { ACCENT_ROOM, genresLine, totalsText } from "./shared";

const CENTER = W / 2;
/** Máximo de linhas por andar. */
const TIER_LINES = [2, 2, 3, 3];

export function drawLineup(ctx: Ctx, d: RecapData, o: RecapOptions) {
  const f = o.font;
  const p = o.palette;

  // Moldura fina no destaque, como um cartaz.
  ctx.strokeStyle = hexAlpha(p.accent, 0.55);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, 1920 - 80, 32);
  ctx.stroke();

  const title = d.title.toLocaleUpperCase(INTL_LOCALE[o.lang]);
  const titleSize = fitFontSize(ctx, title, INNER, 54, 30, (px) => `800 ${px}px ${f}`);
  // Acima do título fica o espaço do acento (Ú, Í, Ô): a linha de cima sobe junto com o tamanho.
  eyebrow(ctx, f, DICTS[o.lang].canvas.presents(d.username), CENTER, 260 - titleSize - ACCENT_ROOM, p.accent, INNER, "center");
  text(ctx, title, CENTER, 260, { font: `800 ${titleSize}px ${f}`, color: p.ink, align: "center", spacing: 2 });
  text(ctx, d.dateText, CENTER, 312, { font: `500 30px ${f}`, color: p.inkSoft, align: "center" });
  ctx.fillStyle = hexAlpha(p.inkSoft, 0.35);
  ctx.fillRect(CENTER - 220, 350, 440, 2);

  // Os andares do lineup.
  let y = 410;
  const colors = [p.accent, p.ink, p.inkSoft, p.inkFaint];
  for (const tier of lineupTiers(d.artists.map((a) => a.name.toLocaleUpperCase(INTL_LOCALE[o.lang])))) {
    const max = TIER_SIZES[tier.level];
    // A atração principal encolhe para caber numa linha; os outros quebram linha entre nomes.
    const size = tier.level === 0 ? fitFontSize(ctx, tier.names[0], INNER, max, 70, (px) => `800 ${px}px ${f}`) : max;
    ctx.font = `800 ${size}px ${f}`;
    ctx.letterSpacing = tier.level === 0 ? "-3px" : "0px";
    const rows = packNames(tier.names, INNER, TIER_LINES[tier.level], measureWith(ctx));
    ctx.letterSpacing = "0px";
    y += size * 0.85;
    for (const row of rows) {
      text(ctx, row, CENTER, y, { font: `800 ${size}px ${f}`, color: colors[tier.level], align: "center", spacing: tier.level === 0 ? -3 : 0 });
      y += size * 1.12;
    }
    y += 28 - size * 0.27;
  }

  // Três capas redondas, centralizadas.
  const r = 110;
  const circlesY = Math.max(y + r + 40, 1430);
  [-1, 0, 1].forEach((offset, i) => {
    const cx = CENTER + offset * (r * 2 + 36);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, circlesY, r, 0, Math.PI * 2);
    ctx.clip();
    cover(ctx, d.covers[i] ?? null, cx - r, circlesY - r, r * 2, r * 2, 0, i);
    ctx.restore();
  });

  // Embaixo: o "ingresso" com o total (se pedir números) ou os gêneros.
  if (o.showNumbers) {
    const label = totalsText(d, o);
    // Letra menor se os minutos deixarem o ingresso largo demais.
    let size = 40;
    ctx.font = `800 ${size}px ${f}`;
    while (size > 26 && ctx.measureText(label).width + 80 > INNER) {
      size -= 2;
      ctx.font = `800 ${size}px ${f}`;
    }
    const w = ctx.measureText(label).width + 80;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(CENTER - w / 2, 1690, w, 80, 16);
    ctx.stroke();
    text(ctx, label, CENTER, 1745, { font: `800 ${size}px ${f}`, color: p.accent, align: "center" });
  } else {
    genresLine(ctx, d, o, CENTER, 1745, INNER, "center");
  }

  footer(ctx, p, f, d.siteHost, 1830);
}
