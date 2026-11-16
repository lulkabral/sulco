// Funções puras que transformam o JSON cru do Last.fm nos nossos tipos.
// Recebem `unknown` de propósito: a resposta vem de fora e não confiamos no formato.

import type {
  ArtistTagsResponse,
  Scrobble,
  ScrobblePage,
  TopAlbum,
  TopArtist,
  TopItem,
  TopTrack,
  TopType,
  UserInfo,
} from "./types";

/** Trecho presente no endereço da imagem genérica (estrela) que o Last.fm usa no lugar de fotos. */
export const PLACEHOLDER_IMAGE_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function obj(value: unknown): Obj {
  return isObj(value) ? value : {};
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** Número que pode chegar como texto ("258"). Valor estranho vira 0. */
function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(str(value));
  return Number.isFinite(n) ? n : 0;
}

/** Aceita lista, objeto único ou nada, e sempre devolve lista. */
export function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

/**
 * Escolhe a maior imagem da lista `image` do Last.fm.
 * Devolve null se estiver vazia ou se for o placeholder de estrela.
 */
export function pickImage(images: unknown): string | null {
  const urls = toArray(images)
    .map((img) => str(obj(img)["#text"]))
    .filter((url) => url !== "");
  const url = urls.at(-1);
  if (!url || url.includes(PLACEHOLDER_IMAGE_HASH)) return null;
  return url;
}

/** Artista pode vir como objeto ({ name }) ou como texto ({ "#text" }) conforme o método. */
function artistName(value: unknown): string {
  if (typeof value === "string") return value;
  const a = obj(value);
  return str(a.name) || str(a["#text"]);
}

/**
 * Se a resposta for um erro do Last.fm ({ error: 6, message: "..." }),
 * devolve o número do erro. Caso contrário, null.
 */
export function getLastfmErrorNumber(raw: unknown): number | null {
  const e = obj(raw).error;
  if (e === undefined) return null;
  const n = num(e);
  return n > 0 ? n : null;
}

export function normalizeUserInfo(raw: unknown): UserInfo {
  const u = obj(obj(raw).user);
  const username = str(u.name);
  return {
    username,
    name: str(u.realname).trim() || null,
    url: str(u.url) || `https://www.last.fm/user/${encodeURIComponent(username)}`,
    avatarUrl: pickImage(u.image),
    playcount: num(u.playcount),
    registeredAt: num(obj(u.registered).unixtime),
  };
}

function rankOf(item: Obj, index: number): number {
  return num(obj(item["@attr"]).rank) || index + 1;
}

function normalizeArtist(item: Obj, index: number): TopArtist {
  return {
    rank: rankOf(item, index),
    name: str(item.name),
    playcount: num(item.playcount),
    url: str(item.url),
  };
}

function normalizeAlbum(item: Obj, index: number): TopAlbum {
  return {
    rank: rankOf(item, index),
    name: str(item.name),
    artist: artistName(item.artist),
    playcount: num(item.playcount),
    url: str(item.url),
    imageUrl: pickImage(item.image),
  };
}

function normalizeTrack(item: Obj, index: number): TopTrack {
  return {
    rank: rankOf(item, index),
    name: str(item.name),
    artist: artistName(item.artist),
    playcount: num(item.playcount),
    url: str(item.url),
  };
}

// Onde fica a lista em cada resposta: { topartists: { artist: [...] } } etc.
const TOP_KEYS: Record<TopType, { root: string; item: string }> = {
  artists: { root: "topartists", item: "artist" },
  albums: { root: "topalbums", item: "album" },
  tracks: { root: "toptracks", item: "track" },
};

export function normalizeTop(type: TopType, raw: unknown): { total: number; items: TopItem[] } {
  const keys = TOP_KEYS[type];
  const root = obj(obj(raw)[keys.root]);
  const list = toArray(root[keys.item]).filter(isObj);
  const normalizeItem =
    type === "artists" ? normalizeArtist : type === "albums" ? normalizeAlbum : normalizeTrack;
  return {
    total: num(obj(root["@attr"]).total),
    items: list.map((item, i) => normalizeItem(item, i)),
  };
}

/**
 * Total de scrobbles de uma resposta de `user.getRecentTracks`
 * (campo `recenttracks["@attr"].total`, que conta o intervalo `from`/`to` inteiro).
 */
export function normalizeRecentTotal(raw: unknown): number {
  return num(obj(obj(obj(raw).recenttracks)["@attr"]).total);
}

/**
 * Tags de `artist.getTopTags`. Mantém o nome como veio (a normalização de gênero
 * fica em src/lib/genres.ts) e descarta tags sem nome.
 */
export function normalizeArtistTags(raw: unknown, artist: string): ArtistTagsResponse {
  const root = obj(obj(raw).toptags);
  const tags = toArray(root.tag)
    .filter(isObj)
    .map((t) => ({ name: str(t.name).trim(), count: num(t.count) }))
    .filter((t) => t.name !== "");
  return { artist: str(obj(root["@attr"]).artist) || artist, tags };
}

/**
 * Uma página de `user.getRecentTracks` com `from`/`to`.
 * Descarta a faixa "tocando agora" (vem sem `date`, até em meses passados: armadilha 3).
 */
export function normalizeScrobblePage(raw: unknown): ScrobblePage {
  const root = obj(obj(raw).recenttracks);
  const attr = obj(root["@attr"]);
  const tracks: Scrobble[] = [];
  for (const item of toArray(root.track).filter(isObj)) {
    if (str(obj(item["@attr"]).nowplaying) === "true") continue;
    const playedAt = num(obj(item.date).uts);
    if (playedAt <= 0) continue;
    tracks.push({
      artist: artistName(item.artist),
      album: str(obj(item.album)["#text"]).trim(),
      name: str(item.name),
      url: str(item.url),
      imageUrl: pickImage(item.image),
      playedAt,
    });
  }
  return {
    page: num(attr.page) || 1,
    totalPages: num(attr.totalPages),
    total: num(attr.total),
    tracks,
  };
}

// Onde fica a lista em cada gráfico: { weeklyartistchart: { artist: [...] } } etc.
const CHART_KEYS: Record<TopType, { root: string; item: string }> = {
  artists: { root: "weeklyartistchart", item: "artist" },
  albums: { root: "weeklyalbumchart", item: "album" },
  tracks: { root: "weeklytrackchart", item: "track" },
};

/**
 * Gráfico de um intervalo (`user.getWeekly*Chart` com `from`/`to`). Os itens têm o mesmo
 * formato dos tops, então reaproveita a mesma normalização. Corta em `limit` itens
 * (o Last.fm devolve até 1000).
 */
export function normalizeChart(type: TopType, raw: unknown, limit: number): TopItem[] {
  const keys = CHART_KEYS[type];
  const list = toArray(obj(obj(raw)[keys.root])[keys.item]).filter(isObj).slice(0, limit);
  const normalizeItem =
    type === "artists" ? normalizeArtist : type === "albums" ? normalizeAlbum : normalizeTrack;
  return list.map((item, i) => normalizeItem(item, i));
}

/** Capa de `album.getInfo` (maior tamanho), ou null. */
export function normalizeAlbumCover(raw: unknown): string | null {
  return pickImage(obj(obj(raw).album).image);
}

/** Capa do álbum de `track.getInfo` (maior tamanho), ou null se a música não tiver álbum. */
export function normalizeTrackCover(raw: unknown): string | null {
  return pickImage(obj(obj(obj(raw).track).album).image);
}

/** Duração da música em segundos (`track.getInfo` dá em ms), ou null se for 0 ou faltar. */
export function normalizeTrackDuration(raw: unknown): number | null {
  const ms = num(obj(obj(raw).track).duration);
  return ms > 0 ? Math.round(ms / 1000) : null;
}

/** Soma dos plays de todos os itens do gráfico (sem cortar). */
export function sumChartPlays(type: TopType, raw: unknown): number {
  const keys = CHART_KEYS[type];
  return toArray(obj(obj(raw)[keys.root])[keys.item])
    .filter(isObj)
    .reduce((sum: number, item) => sum + num(item.playcount), 0);
}
