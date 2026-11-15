// Cálculo dos gêneros a partir das tags dos artistas (SPEC, seção "Gêneros").
// Tudo aqui é puro: recebe dados, devolve dados. As listas abaixo são a "configuração"
// e devem ser ajustadas olhando resultados reais.

import type { ArtistTag } from "@/lib/lastfm/types";

/** Quantos artistas do topo entram na conta. */
export const GENRE_ARTISTS = 20;
/** Quantas tags (as mais fortes, depois do descarte) contam por artista. */
export const TAGS_PER_ARTIST = 5;
/** Tamanho do top de gêneros. */
export const GENRE_LIMIT = 5;

/** Grafias diferentes do mesmo gênero (já em minúsculas e sem hífen) -> forma única. */
const ALIASES: Record<string, string> = {
  hiphop: "hip hop",
  rnb: "r&b",
  "r n b": "r&b",
  "r'n'b": "r&b",
  "rhythm and blues": "r&b",
  kpop: "k pop",
  jpop: "j pop",
  jrock: "j rock",
  lofi: "lo fi",
  synthpop: "synth pop",
  postpunk: "post punk",
  postrock: "post rock",
  "nu-metal": "nu metal",
};

/** Como mostrar alguns gêneros (o resto aparece como o Last.fm escreveu, em minúsculas). */
const DISPLAY: Record<string, string> = {
  "hip hop": "hip-hop",
  "r&b": "R&B",
  "k pop": "k-pop",
  "j pop": "j-pop",
  "j rock": "j-rock",
  "lo fi": "lo-fi",
  "synth pop": "synthpop",
  "post punk": "post-punk",
  "post rock": "post-rock",
  "post hardcore": "post-hardcore",
  "pop punk": "pop punk",
  edm: "EDM",
  mpb: "MPB",
};

/** Tags que não são gênero (sempre na forma de `genreKey`). */
const NOT_GENRE = new Set([
  // gosto pessoal e organização
  "seen live",
  "favorites",
  "favourites",
  "favorite",
  "favourite",
  "favorite songs",
  "favourite songs",
  "my top songs",
  "albums i own",
  "loved",
  "love",
  "beautiful",
  "awesome",
  "amazing",
  "cool",
  "good",
  "great",
  "best",
  "catchy",
  "check out",
  "spotify",
  "under 2000 listeners",
  // quem canta e de onde veio ("male vocalists" e parecidos saem pela VOCALIST_RE)
  "covers",
  "cover",
  "the voice",
  "the voice uk",
  "x factor",
  "american",
  "usa",
  "us",
  "united states",
  "united kingdom",
  "british",
  "uk",
  "english",
  "welsh",
  "scottish",
  "irish",
  "canadian",
  "australian",
  "german",
  "french",
  "swedish",
  "norwegian",
  "finnish",
  "danish",
  "dutch",
  "italian",
  "spanish",
  "japanese",
  "korean",
  "mexican",
  "argentinian",
  "portuguese",
  "brazilian",
  "brasil",
  "brazil",
]);

/** Anos e décadas: "80s", "00s", "1990s", "2010". */
const YEAR_RE = /^(\d{2}s|\d{4}s?)$/;

/** "male vocalists", "female vocalist", "male vocalistas" (sim, aparece em português)... */
const VOCALIST_RE = /vocalist/;

/**
 * Chave de comparação de um gênero: minúsculas, hífen e "_" viram espaço,
 * espaços repetidos somem e apelidos viram a forma única.
 * Exemplo: "Hip-Hop" -> "hip hop", "RnB" -> "r&b".
 */
export function genreKey(tag: string): string {
  const base = tag.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  return ALIASES[base] ?? ALIASES[base.replace(/ /g, "")] ?? base;
}

/** Nome para mostrar: a forma da tabela DISPLAY ou, sem ela, a grafia original em minúsculas. */
export function genreLabel(key: string, original = key): string {
  return DISPLAY[key] ?? original.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * A tag não é gênero? (lista de descarte, ano/década ou nome do próprio artista).
 * `key` e `artistKey` já passaram por `genreKey`.
 */
export function isNotGenre(key: string, artistKey: string): boolean {
  if (key === "" || NOT_GENRE.has(key) || YEAR_RE.test(key) || VOCALIST_RE.test(key)) return true;
  if (key === artistKey) return true;
  // Pedaço do nome do artista com 2+ palavras ("kpop demon hunters" em "KPop Demon Hunters Cast").
  // Com 1 palavra não: "pop" não pode sumir só porque o artista se chama "Pop Smoke".
  return key.includes(" ") && artistKey.includes(key);
}

export type GenreInput = {
  name: string;
  playcount: number;
  tags: ArtistTag[];
};

export type Genre = {
  name: string;
  /** Soma de plays x força da tag / 100. Serve para ordenar, não é contagem de plays. */
  weight: number;
};

/**
 * Top de gêneros: para cada artista, descarta o que não é gênero, pega as
 * `TAGS_PER_ARTIST` tags mais fortes e soma plays x (força / 100) em cada gênero.
 */
export function computeTopGenres(artists: GenreInput[], limit = GENRE_LIMIT): Genre[] {
  const totals = new Map<string, number>();
  const labels = new Map<string, string>(); // chave -> primeira grafia vista

  for (const artist of artists) {
    const artistKey = genreKey(artist.name);
    // A mesma tag pode vir com grafias diferentes no mesmo artista: fica a mais forte.
    const strongest = new Map<string, number>();
    for (const tag of artist.tags) {
      const key = genreKey(tag.name);
      if (tag.count <= 0 || isNotGenre(key, artistKey)) continue;
      if (!labels.has(key)) labels.set(key, tag.name);
      strongest.set(key, Math.max(strongest.get(key) ?? 0, tag.count));
    }

    const top = [...strongest].sort((a, b) => b[1] - a[1]).slice(0, TAGS_PER_ARTIST);
    for (const [key, count] of top) {
      totals.set(key, (totals.get(key) ?? 0) + artist.playcount * (count / 100));
    }
  }

  return [...totals]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, weight]) => ({ name: genreLabel(key, labels.get(key)), weight }));
}

/**
 * Roda `fn` em cada item com no máximo `limit` execuções ao mesmo tempo
 * (regra do projeto: 3 a 4 chamadas simultâneas). Mantém a ordem dos resultados.
 */
export async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
