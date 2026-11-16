// Relatório para ajustar a lista de descarte de gêneros (src/lib/genres.ts).
// Uso: npm run genres -- USERNAME [periodo]   (periodo: 7day, 1month, 3month, 6month, 12month)
// Lê a chave de .env.local e fala direto com o Last.fm (roda só na sua máquina; não imprime a chave).

import fs from "node:fs";
import {
  computeTopGenres,
  GENRE_ARTISTS,
  genreKey,
  isNotGenre,
  mapWithLimit,
  TAGS_PER_ARTIST,
} from "../src/lib/genres.ts";

const [user, period = "1month"] = process.argv.slice(2);
if (!user) {
  console.error("Uso: npm run genres -- USERNAME [periodo]");
  process.exit(1);
}

const key = fs.readFileSync(".env.local", "utf8").match(/^LASTFM_API_KEY=(.*)$/m)?.[1].trim();
if (!key) throw new Error("LASTFM_API_KEY não encontrada em .env.local");

async function call(params: Record<string, string>) {
  const url = "https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({ ...params, api_key: key!, format: "json" });
  const res = await fetch(url, { headers: { "User-Agent": "sulco/0.1 (projeto não comercial)" } });
  return res.json();
}

const top = await call({ method: "user.gettopartists", user, period, limit: String(GENRE_ARTISTS) });
const artists: { name: string; playcount: number }[] = (top.topartists?.artist ?? []).map(
  (a: { name: string; playcount: string }) => ({ name: a.name, playcount: Number(a.playcount) }),
);

const withTags = await mapWithLimit(artists, 3, async (a) => {
  const raw = await call({ method: "artist.gettoptags", artist: a.name });
  const tags = (raw.toptags?.tag ?? []).map((t: { name: string; count: number }) => ({ name: t.name, count: Number(t.count) }));
  return { ...a, tags };
});

console.log(`\nTop gêneros de ${user} (${period}):`);
for (const [i, g] of computeTopGenres(withTags, 10).entries()) {
  console.log(`  ${String(i + 1).padStart(2)}. ${g.name.padEnd(24)} peso ${g.weight.toFixed(1)}`);
}

// Tags que o descarte tirou, com o peso que teriam: confira se alguma é gênero de verdade.
const discarded = new Map<string, number>();
console.log("\nPor artista (tags usadas | descartadas):");
for (const a of withTags) {
  const artistKey = genreKey(a.name);
  const used: string[] = [];
  const dropped: string[] = [];
  for (const t of a.tags) {
    const k = genreKey(t.name);
    if (isNotGenre(k, artistKey)) {
      dropped.push(`${t.name}:${t.count}`);
      discarded.set(k, (discarded.get(k) ?? 0) + (a.playcount * t.count) / 100);
    } else if (used.length < TAGS_PER_ARTIST && t.count > 0) {
      used.push(`${t.name}:${t.count}`);
    }
  }
  console.log(`  ${a.name} (${a.playcount}) | ${used.join(", ") || "—"} | ${dropped.join(", ") || "—"}`);
}

console.log("\nDescartadas, por peso que teriam:");
for (const [k, w] of [...discarded].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${k.padEnd(24)} ${w.toFixed(1)}`);
}
