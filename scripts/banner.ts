// Banner do X (1500 x 500 e 3000 x 1000) da conta oficial do sulco.
// NÃO faz parte do site: roda só na sua máquina, com a chave de .env.local.
//
// Uso:
//   npm run banner                          (lê brand/banner.json)
//   npm run banner -- brand/outro.json      (lê outro arquivo)
//
// O arquivo de configuração tem o título e o subtítulo (troque a cada banner) e
// até 10 itens. Item sem "album" usa o álbum mais popular do artista (o Last.fm
// não tem foto de artista, só capa de álbum). Precisa do ImageMagick (comando `convert`).

import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { bannerLayout, BANNER_H, BANNER_W, MAX_COVERS } from "../src/lib/banner/layout.ts";
import { mapWithLimit } from "../src/lib/genres.ts";
import { coverUrl } from "../src/lib/grid/layout.ts";
import { normalizeAlbumCover, normalizeTop } from "../src/lib/lastfm/normalize.ts";

const run = promisify(execFile);

type Item = { artista: string; album?: string };
type Config = { titulo: string; subtitulo?: string; itens: Item[]; arquivo?: string };

/** Escala de desenho: tudo é feito em 3000 x 1000 e depois reduzido (fica mais nítido). */
const S = 2;
const COLORS = { room: "#15120F", ink: "#F4EEE6", inkSoft: "#B5ABA0" };
const TILES = ["#B8432C", "#3D5A73", "#D9A441", "#5E4B6E", "#2F6B5E", "#8A6A4F", "#C77C9B", "#29333F"];
const FONT_BOLD = "assets/PlusJakartaSans-800.ttf";
const FONT_MEDIUM = "assets/PlusJakartaSans-500.ttf";
const SYMBOL = "brand/simbolo-800.png";
const IMAGE_HOST = "lastfm-img.freetls.fastly.net";

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function readConfig(file: string): Config {
  if (!fs.existsSync(file)) {
    fail(`Não achei ${file}. Crie esse arquivo copiando o exemplo e depois edite:\n  cp brand/banner.exemplo.json ${file}`);
  }
  let data: Config;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fail(`${file} não é um JSON válido.`);
  }
  if (typeof data.titulo !== "string" || !data.titulo.trim()) fail(`"titulo" é obrigatório em ${file}.`);
  if (!Array.isArray(data.itens) || data.itens.length === 0) fail(`"itens" precisa ter de 1 a ${MAX_COVERS} artistas/álbuns.`);
  if (data.itens.length > MAX_COVERS) console.warn(`! Mais de ${MAX_COVERS} itens: usando só os ${MAX_COVERS} primeiros.`);
  for (const it of data.itens) {
    if (typeof it?.artista !== "string" || !it.artista.trim()) fail(`Todo item precisa de "artista".`);
  }
  return data;
}

function apiKey(): string {
  const env = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
  const key = env.match(/^LASTFM_API_KEY=(.*)$/m)?.[1].trim();
  if (!key) fail("LASTFM_API_KEY não encontrada em .env.local.");
  return key;
}

async function lastfm(key: string, params: Record<string, string>): Promise<unknown> {
  const url = "https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({ ...params, api_key: key, format: "json" });
  const res = await fetch(url, { headers: { "User-Agent": "sulco/0.1 (projeto não comercial)" } });
  return res.json();
}

/** Capa (600 px) de um item: o álbum indicado ou o mais popular do artista. */
async function findCover(key: string, item: Item): Promise<{ label: string; url: string | null }> {
  if (item.album) {
    const raw = await lastfm(key, { method: "album.getInfo", artist: item.artista, album: item.album, autocorrect: "1" });
    const url = normalizeAlbumCover(raw);
    return { label: `${item.artista} — ${item.album}`, url: url && coverUrl(url, 600) };
  }
  const raw = await lastfm(key, { method: "artist.getTopAlbums", artist: item.artista, limit: "3", autocorrect: "1" });
  // O 1º com capa (às vezes o mais popular vem sem imagem).
  const albums = normalizeTop("albums", { topalbums: (raw as { topalbums?: unknown }).topalbums }).items as {
    name: string;
    imageUrl: string | null;
  }[];
  const best = albums.find((a) => a.imageUrl) ?? albums[0];
  return { label: `${item.artista} — ${best?.name ?? "?"}`, url: best?.imageUrl ? coverUrl(best.imageUrl, 600) : null };
}

async function download(url: string, file: string): Promise<boolean> {
  // Só baixa do servidor de imagens do Last.fm.
  if (new URL(url).host !== IMAGE_HOST) return false;
  const res = await fetch(url);
  if (!res.ok) return false;
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

/** Texto para o -annotate do ImageMagick: "@" no começo leria um arquivo, e "%" é código. */
function imText(text: string): string {
  const escaped = text.replace(/%/g, "%%");
  return escaped.startsWith("@") ? `\\${escaped}` : escaped;
}

/** Maior tamanho de fonte (até `max`) em que o texto cabe em `maxWidth` px. */
async function fitPointSize(font: string, text: string, max: number, maxWidth: number): Promise<number> {
  for (let pt = max; pt > 12; pt -= 4) {
    const { stdout } = await run("convert", ["-font", font, "-pointsize", String(pt), `label:${imText(text)}`, "-format", "%w", "info:"]);
    if (Number(stdout) <= maxWidth) return pt;
  }
  return 12;
}

async function main() {
  const configFile = process.argv[2] ?? "brand/banner.json";
  const config = readConfig(configFile);
  const key = apiKey();
  const items = config.itens.slice(0, MAX_COVERS);

  try {
    await run("convert", ["-version"]);
  } catch {
    fail("Precisa do ImageMagick instalado (comando `convert`).");
  }

  console.log(`Buscando ${items.length} capas no Last.fm...`);
  const found = await mapWithLimit(items, 3, (it) => findCover(key, it));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sulco-banner-"));
  const layout = bannerLayout(items.length);
  const side = layout.covers[0].w * S;
  const radius = layout.radius * S;

  // 1) Cada capa recortada com cantos arredondados (ou um quadrado colorido, se não houver).
  const coverFiles: (string | null)[] = [];
  for (const [i, f] of found.entries()) {
    const raw = path.join(tmp, `raw-${i}.img`);
    const out = path.join(tmp, `cover-${i}.png`);
    const ok = f.url ? await download(f.url, raw) : false;
    console.log(`  ${ok ? "✓" : "✗ sem capa:"} ${f.label}`);
    if (!ok) {
      coverFiles.push(null);
      continue;
    }
    await run("convert", [
      raw, "-resize", `${side}x${side}^`, "-gravity", "center", "-extent", `${side}x${side}`,
      "(", "-size", `${side}x${side}`, "xc:none", "-fill", "white",
      "-draw", `roundrectangle 0,0,${side - 1},${side - 1},${radius},${radius}`, ")",
      "-compose", "DstIn", "-composite", out,
    ]);
    coverFiles.push(out);
  }

  // 2) Monta o banner grande.
  const args: string[] = ["-size", `${BANNER_W * S}x${BANNER_H * S}`, `xc:${COLORS.room}`];
  layout.covers.forEach((r, i) => {
    const file = coverFiles[i];
    if (file) {
      args.push(file, "-geometry", `+${r.x * S}+${r.y * S}`, "-composite");
    } else {
      const [x, y] = [r.x * S, r.y * S];
      args.push("-fill", TILES[i % TILES.length], "-draw", `roundrectangle ${x},${y},${x + side},${y + side},${radius},${radius}`);
    }
  });

  // Logo: disco (o "S", da altura do "l") + "ulco", apoiados na mesma linha de base.
  const logoPt = layout.logo.fontPx * S;
  const box = Math.round((logoPt * 0.717) / 0.95);
  const baseline = layout.logo.baseline * S;
  args.push(
    "(", SYMBOL, "-resize", `${box}x${box}`, ")",
    "-geometry", `+${layout.logo.x * S}+${Math.round(baseline - box * (390 / 400))}`, "-composite",
    "-font", FONT_BOLD, "-pointsize", String(logoPt), "-kerning", String(-logoPt * 0.05),
    "-fill", COLORS.ink, "-annotate", `+${layout.logo.x * S + box}+${baseline}`, "ulco",
  );

  // Título e subtítulo (diminuem para caber, se forem longos).
  const titlePt = await fitPointSize(FONT_BOLD, config.titulo, layout.title.fontPx * S, layout.title.maxWidth * S);
  args.push(
    "-font", FONT_BOLD, "-pointsize", String(titlePt), "-kerning", String(-titlePt * 0.03),
    "-fill", COLORS.ink, "-annotate", `+${layout.title.x * S}+${layout.title.baseline * S}`, imText(config.titulo),
  );
  if (config.subtitulo) {
    const subPt = await fitPointSize(FONT_MEDIUM, config.subtitulo, layout.subtitle.fontPx * S, layout.subtitle.maxWidth * S);
    args.push(
      "-font", FONT_MEDIUM, "-pointsize", String(subPt), "-kerning", "0",
      "-fill", COLORS.inkSoft, "-annotate", `+${layout.subtitle.x * S}+${layout.subtitle.baseline * S}`, imText(config.subtitulo),
    );
  }

  const name = config.arquivo ?? `banner-${new Date().toISOString().slice(0, 7)}`;
  const big = path.join("brand", `${name}-3000x1000.png`);
  const small = path.join("brand", `${name}-1500x500.png`);
  await run("convert", [...args, big]);
  await run("convert", [big, "-resize", `${BANNER_W}x${BANNER_H}`, small]);
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(`\nPronto:\n  ${small}\n  ${big}\n`);
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
