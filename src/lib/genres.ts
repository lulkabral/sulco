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
  "legend",
  "queen of pop",
  "king of pop",
  "guitar",
  "male",
  "female",
  "queer",
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
  "belgian",
  "chilean",
  "argentine",
  "colombian",
  "peruvian",
  "uruguayan",
  "venezuelan",
  "cuban",
  "puerto rican",
  "icelandic",
  // países (aparecem tanto quanto as nacionalidades)
  "argentina",
  "belgium",
  "canada",
  "chile",
  "colombia",
  "cuba",
  "denmark",
  "england",
  "finland",
  "france",
  "germany",
  "ireland",
  "italy",
  "japan",
  "korea",
  "south korea",
  "mexico",
  "netherlands",
  "norway",
  "peru",
  "portugal",
  "puerto rico",
  "scotland",
  "spain",
  "sweden",
  "uruguay",
  "venezuela",
  "california",
  "greece",
  "greek",
  "russia",
  "russian",
  "poland",
  "polish",
  "ukraine",
  "ukrainian",
  "china",
  "chinese",
  "taiwan",
  "taiwanese",
  "nigeria",
  "nigerian",
  "south africa",
  "australia",
  "new zealand",
  "jamaica",
  "jamaican",
  // estados e cidades (gênero com lugar no nome, como "detroit trap", continua valendo)
  "texas",
  "florida",
  "georgia",
  "missouri",
  "tennessee",
  "louisiana",
  "michigan",
  "ohio",
  "new york",
  "nyc",
  "los angeles",
  "la",
  "chicago",
  "atlanta",
  "houston",
  "detroit",
  "memphis",
  "miami",
  "new orleans",
  "philadelphia",
  "seattle",
  "london",
  "manchester",
  "toronto",
  "montreal",
  "seoul",
  "tokyo",
  "pernambuco",
  "bahia",
  "minas gerais",
  "rio de janeiro",
  "sao paulo",
  "são paulo",
  "recife",
  "salvador",
  "belo horizonte",
  // vagas demais para serem gênero
  "ethnic",
  "world",
]);

/**
 * Tags erradas de um artista específico (chave e tags na forma de `genreKey`). Acontece quando
 * o Last.fm junta duas pessoas com o mesmo nome: a Marina Sena brasileira herdou as tags de
 * uma cantora grega. Use pouco: só para artista conhecido com tag claramente trocada.
 */
const WRONG_TAGS: Record<string, string[]> = {
  "marina sena": ["greek", "greek pop", "ethnic", "laiko", "entechno", "greek folk", "pop folk"],
};

/** Anos, décadas e números soltos: "80s", "00s", "1990s", "2010", "11". */
const YEAR_RE = /^(\d{2}s|\d{4}s|\d+)$/;

/** "male vocalists", "female vocalist", "male vocalistas" (sim, aparece em português)... */
const VOCALIST_RE = /vocalist/;

/** Tags de piada/comparação: "better than nicki minaj". */
const JOKE_RE = /^better than /;

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
  if (key === "" || NOT_GENRE.has(key) || YEAR_RE.test(key)) return true;
  if (VOCALIST_RE.test(key) || JOKE_RE.test(key)) return true;
  if (key === artistKey) return true;
  if (WRONG_TAGS[artistKey]?.includes(key)) return true;
  // Pedaço do nome do artista com 2+ palavras ("kpop demon hunters" em "KPop Demon Hunters Cast").
  // Com 1 palavra não: "pop" não pode sumir só porque o artista se chama "Pop Smoke".
  return key.includes(" ") && artistKey.includes(key);
}

/** Tag sem descrição só conta como gênero se tanta gente a usa. */
export const MIN_TAG_REACH = 1000;

/**
 * A tag parece gênero de verdade? Gênero tem descrição no Last.fm ou é muito usado.
 * Apelido de fã ("martin", "james": integrantes do CORTIS) não tem descrição e é pouco usado.
 */
export function looksLikeGenre(info: { reach: number; hasWiki: boolean }): boolean {
  return info.hasWiki || info.reach >= MIN_TAG_REACH;
}

/** Rodadas de conferência: cada uma tira as tags recusadas e refaz o top. */
const CHECK_ROUNDS = 3;

/**
 * Top de gêneros conferido: calcula o top, pergunta a `isGenre` só pelas tags do top
 * (as outras não aparecem, então não gastam chamada), tira as recusadas e refaz.
 * Cada tag é conferida uma vez. `isGenre` recebe o nome como o Last.fm escreveu.
 */
export async function computeCheckedGenres(
  artists: GenreInput[],
  isGenre: (tag: string) => Promise<boolean>,
  limit = GENRE_LIMIT,
): Promise<Genre[]> {
  const checked = new Map<string, boolean>(); // nome mostrado -> é gênero?
  const exclude = new Set<string>();
  let top = computeTopGenres(artists, limit);
  for (let round = 0; round < CHECK_ROUNDS; round++) {
    const pending = top.filter((g) => !checked.has(g.name));
    if (pending.length === 0) break;
    const answers = await mapWithLimit(pending, 3, (g) => isGenre(g.name));
    pending.forEach((g, i) => {
      checked.set(g.name, answers[i]);
      if (!answers[i]) exclude.add(genreKey(g.name));
    });
    top = computeTopGenres(artists, limit, exclude);
  }
  return top.filter((g) => checked.get(g.name) !== false);
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
  /** Artistas que mais puxaram este gênero (até 3), do maior para o menor. */
  artists: string[];
};

/** Quantos artistas guardar por gênero (as bolinhas na lista "Gêneros"). */
export const ARTISTS_PER_GENRE = 3;

/**
 * Top de gêneros: para cada artista, descarta o que não é gênero, pega as
 * `TAGS_PER_ARTIST` tags mais fortes e soma plays x (força / 100) em cada gênero.
 */
export function computeTopGenres(
  artists: GenreInput[],
  limit = GENRE_LIMIT,
  /** Tags (na forma de `genreKey`) recusadas pela conferência no Last.fm. */
  exclude: ReadonlySet<string> = new Set(),
): Genre[] {
  const totals = new Map<string, number>();
  const labels = new Map<string, string>(); // chave -> primeira grafia vista
  const contributors = new Map<string, { name: string; amount: number }[]>(); // gênero -> artistas

  for (const artist of artists) {
    const artistKey = genreKey(artist.name);
    // A mesma tag pode vir com grafias diferentes no mesmo artista: fica a mais forte.
    const strongest = new Map<string, number>();
    for (const tag of artist.tags) {
      const key = genreKey(tag.name);
      if (tag.count <= 0 || exclude.has(key) || isNotGenre(key, artistKey)) continue;
      if (!labels.has(key)) labels.set(key, tag.name);
      strongest.set(key, Math.max(strongest.get(key) ?? 0, tag.count));
    }

    const top = [...strongest].sort((a, b) => b[1] - a[1]).slice(0, TAGS_PER_ARTIST);
    for (const [key, count] of top) {
      const amount = artist.playcount * (count / 100);
      totals.set(key, (totals.get(key) ?? 0) + amount);
      if (amount > 0) {
        const list = contributors.get(key) ?? [];
        list.push({ name: artist.name, amount });
        contributors.set(key, list);
      }
    }
  }

  return [...totals]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, weight]) => ({
      name: genreLabel(key, labels.get(key)),
      weight,
      artists: (contributors.get(key) ?? [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, ARTISTS_PER_GENRE)
        .map((a) => a.name),
    }));
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
