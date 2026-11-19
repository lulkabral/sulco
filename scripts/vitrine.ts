// Confere a vitrine da página inicial (src/data/vitrine.json) antes de publicar:
// procura cada álbum no Last.fm e diz se achou a capa. Roda só na sua máquina,
// com a chave de .env.local.
//
// Uso:  npm run vitrine
// Depois: git add src/data/vitrine.json && git commit -m "Vitrine: ..." && git push
// (a Vercel publica sozinha e a página inicial já sai com a lista nova).

import fs from "node:fs";
import { mapWithLimit } from "../src/lib/genres.ts";
import { normalizeAlbumCover } from "../src/lib/lastfm/normalize.ts";
import { HAND_MAX_WORDS, parseShowcase, SHOWCASE_MAX, wordCount } from "../src/lib/showcase.ts";

const FILE = "src/data/vitrine.json";

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function apiKey(): string {
  const env = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
  const key = env.match(/^LASTFM_API_KEY=(.*)$/m)?.[1].trim();
  if (!key) fail("LASTFM_API_KEY não encontrada em .env.local.");
  return key;
}

async function main() {
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    fail(`${FILE} não existe ou não é um JSON válido.`);
  }
  const raw = data as { itens?: unknown[] };
  const { caption, captionEn, captionEs, items } = parseShowcase(data);
  for (const [field, text] of [["legenda", caption], ["legenda_en", captionEn], ["legenda_es", captionEs]]) {
    if (wordCount(text) > HAND_MAX_WORDS)
      console.warn(`! "${field}" tem ${wordCount(text)} palavras: a legenda da prateleira aceita até ${HAND_MAX_WORDS} (docs/MARCA.md).`);
  }
  if ((raw.itens?.length ?? 0) > SHOWCASE_MAX) console.warn(`! Mais de ${SHOWCASE_MAX} itens: o site usa só os ${SHOWCASE_MAX} primeiros.`);
  if (items.length === 0) fail(`Nenhum item com "artista" e "album" em ${FILE}.`);

  const key = apiKey();
  console.log(`\nLegenda: "↑ ${caption || "em evidência"}"\n`);
  const found = await mapWithLimit(items, 3, async (it) => {
    const url =
      "https://ws.audioscrobbler.com/2.0/?" +
      new URLSearchParams({ method: "album.getInfo", artist: it.artist, album: it.album, autocorrect: "1", api_key: key, format: "json" });
    const res = await fetch(url, { headers: { "User-Agent": "sulco/0.1 (projeto não comercial)" } });
    return normalizeAlbumCover(await res.json());
  });

  items.forEach((it, i) => {
    console.log(`${found[i] ? "✓" : "✗"} ${it.artist} — ${it.album}${found[i] ? `\n    ${found[i]}` : "\n    sem capa no Last.fm: confira a grafia no last.fm/music/..."}`);
  });

  const ok = found.filter(Boolean).length;
  console.log(`\n${ok} de ${items.length} capas encontradas.`);
  if (ok < 4) {
    console.log("! Com menos de 4 capas, o site mostra os álbuns em alta no mundo no lugar da vitrine.");
    process.exit(1);
  }
  console.log("Tudo certo. Para publicar: git add src/data/vitrine.json && git commit && git push\n");
}

main();
