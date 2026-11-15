// Funções puras que transformam o JSON cru do Last.fm nos nossos tipos.
// Recebem `unknown` de propósito: a resposta vem de fora e não confiamos no formato.

import type { TopAlbum, TopArtist, TopItem, TopTrack, TopType, UserInfo } from "./types";

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
