// Único lugar do projeto que conhece a chave do Last.fm e faz chamadas a ele.
// "server-only" faz o build falhar se este arquivo for importado por código do navegador.
import "server-only";

import { cacheLife } from "next/cache";
import { computeTopGenres, mapWithLimit, type Genre } from "@/lib/genres";
import vitrine from "@/data/vitrine.json";
import { parseShowcase } from "@/lib/showcase";
import { rankTrendingAlbums, type TrendingCover } from "@/lib/trending";
import { LastfmError, mapLastfmError } from "./errors";
import {
  getLastfmErrorNumber,
  normalizeAlbumCover,
  normalizeTrackCover,
  normalizeTrackDuration,
  normalizeTrackAlbum,
  normalizeChartTracks,
  normalizeArtistTags,
  normalizeChart,
  sumChartPlays,
  normalizeRecentTotal,
  normalizeScrobblePage,
  normalizeTop,
  normalizeUserInfo,
} from "./normalize";
import type {
  ArtistTagsResponse,
  ChartResponse,
  ErrorCode,
  Period,
  ScrobblePage,
  TopResponse,
  TopType,
  UserInfo,
} from "./types";

const API_URL = "https://ws.audioscrobbler.com/2.0/";
const USER_AGENT = "sulco/0.1 (projeto não comercial)";
const TIMEOUT_MS = 8000;

/** Métodos de leitura permitidos (docs/LASTFM.md). Qualquer outro é recusado. */
const ALLOWED_METHODS = [
  "user.getInfo",
  "user.getTopArtists",
  "user.getTopAlbums",
  "user.getTopTracks",
  "user.getRecentTracks",
  "artist.getTopTags",
  "user.getWeeklyArtistChart",
  "user.getWeeklyAlbumChart",
  "user.getWeeklyTrackChart",
  "album.getInfo",
  "track.getInfo",
  "chart.getTopTracks",
] as const;
type Method = (typeof ALLOWED_METHODS)[number];

/** O que a função com cache devolve: o JSON cru ou o nosso código de erro. */
type RawResult = { ok: true; body: unknown } | { ok: false; code: ErrorCode; retry?: boolean };

const RETRY_DELAY_MS = 500;
/** Erros do Last.fm que costumam ser passageiros: 8 (operation failed), 11 e 16 (fora do ar). */
const TRANSIENT_ERRORS = new Set([8, 11, 16]);

/**
 * Por quanto tempo guardar cada tipo de resposta (docs/LASTFM.md):
 * - short: dados do usuário, 10 min "fresco", expira em 30 min;
 * - day: scrobbles de intervalo encerrado: 1 dia "fresco", expira em 7;
 * - week: tags de artista, mudam pouco: 7 dias "fresco", expira em 14;
 * - month: capas de álbum, quase nunca mudam: 30 dias "fresco", expira em 60.
 */
const CACHE_PROFILES = {
  short: { revalidate: 600, expire: 1800 },
  day: { revalidate: 86_400, expire: 604_800 },
  week: { revalidate: 604_800, expire: 1_209_600 },
  month: { revalidate: 2_592_000, expire: 5_184_000 },
} as const;
type CacheProfile = keyof typeof CACHE_PROFILES;

/**
 * Faz a chamada e guarda o resultado em cache (por método + parâmetros).
 * Sucesso fica em cache pelo perfil escolhido. Erro fica só alguns segundos:
 * o bastante para não martelar o Last.fm, curto para o botão "Tentar de novo" funcionar.
 * Erros viram valor de retorno (e não exceção) para atravessar o cache sem perder o código.
 */
async function fetchLastfmCached(
  method: Method,
  params: Record<string, string>,
  cache: CacheProfile,
): Promise<RawResult> {
  "use cache";

  let result = await fetchLastfm(method, params);
  if (!result.ok && result.retry) {
    // Erros temporários (ex.: 8 "operation failed") costumam passar na segunda tentativa.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    result = await fetchLastfm(method, params);
  }
  if (result.ok) {
    cacheLife(CACHE_PROFILES[cache]);
  } else {
    cacheLife({ revalidate: 5, expire: 15 });
  }
  return result;
}

async function fetchLastfm(method: Method, params: Record<string, string>): Promise<RawResult> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    console.error("[lastfm] LASTFM_API_KEY não configurada");
    return { ok: false, code: "LASTFM_DOWN" };
  }

  const url = new URL(API_URL);
  url.search = new URLSearchParams({ ...params, method, api_key: apiKey, format: "json" }).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error(`[lastfm] ${method}: sem resposta (rede ou tempo esgotado)`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    console.error(`[lastfm] ${method}: resposta não é JSON (HTTP ${response.status})`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  // Conferir o campo `error` no JSON, sem confiar só no status HTTP.
  const errorNumber = getLastfmErrorNumber(body);
  if (errorNumber !== null) {
    if (errorNumber === 10 || errorNumber === 26) {
      console.error(`[lastfm] ${method}: chave inválida ou suspensa (erro ${errorNumber})`);
    } else if (errorNumber !== 6) {
      console.error(`[lastfm] ${method}: erro ${errorNumber}`);
    }
    return {
      ok: false,
      code: mapLastfmError(errorNumber),
      retry: TRANSIENT_ERRORS.has(errorNumber),
    };
  }

  if (!response.ok) {
    console.error(`[lastfm] ${method}: HTTP ${response.status}`);
    return { ok: false, code: "LASTFM_DOWN" };
  }

  return { ok: true, body };
}

/** Chama um método permitido e devolve o JSON cru; lança LastfmError em caso de erro. */
async function callLastfm(
  method: Method,
  params: Record<string, string>,
  cache: CacheProfile = "short",
): Promise<unknown> {
  if (!(ALLOWED_METHODS as readonly string[]).includes(method)) {
    throw new LastfmError("BAD_REQUEST", "Método não permitido.");
  }
  const result = await fetchLastfmCached(method, params, cache);
  if (!result.ok) throw new LastfmError(result.code);
  return result.body;
}

export async function getUserInfo(username: string): Promise<UserInfo> {
  const raw = await callLastfm("user.getInfo", { user: username });
  return normalizeUserInfo(raw);
}

const TOP_METHODS: Record<TopType, Method> = {
  artists: "user.getTopArtists",
  albums: "user.getTopAlbums",
  tracks: "user.getTopTracks",
};

export async function getTop(
  username: string,
  type: TopType,
  period: Period,
  limit: number,
): Promise<TopResponse> {
  const raw = await callLastfm(TOP_METHODS[type], {
    user: username,
    period,
    limit: String(limit),
  });
  const { total, items } = normalizeTop(type, raw);
  // O Last.fm às vezes devolve mais itens que o limit pedido; cortamos aqui.
  return { user: username, type, period, total, items: items.slice(0, limit) };
}

/**
 * Total de scrobbles entre `from` e `to` (timestamps UNIX em segundos).
 * Uma chamada só: pede 1 faixa e lê o total que vem junto.
 */
export async function getScrobbleTotal(username: string, from: number, to: number): Promise<number> {
  const raw = await callLastfm("user.getRecentTracks", {
    user: username,
    from: String(from),
    to: String(to),
    limit: "1",
  });
  return normalizeRecentTotal(raw);
}

/**
 * Tags de um artista (cache de 7 dias). Artista que o Last.fm não conhece
 * (erro 6, que viraria USER_NOT_FOUND) devolve lista vazia em vez de erro.
 */
export async function getArtistTags(artist: string): Promise<ArtistTagsResponse> {
  try {
    const raw = await callLastfm("artist.getTopTags", { artist }, "week");
    return normalizeArtistTags(raw, artist);
  } catch (err) {
    if (err instanceof LastfmError && err.code === "USER_NOT_FOUND") return { artist, tags: [] };
    throw err;
  }
}

/** Máximo de buscas de tags ao mesmo tempo (regra do projeto: 3 a 4). */
const TAGS_CONCURRENCY = 3;

/**
 * Top de gêneros dos artistas dados (SPEC, "Gêneros"). Nunca lança erro:
 * artista cujas tags falharem só fica de fora; se falharem todos, devolve null.
 */
export async function getTopGenres(
  artists: { name: string; playcount: number }[],
): Promise<Genre[] | null> {
  const tags = await mapWithLimit(artists, TAGS_CONCURRENCY, async (artist) => {
    try {
      return (await getArtistTags(artist.name)).tags;
    } catch {
      return null;
    }
  });
  if (artists.length > 0 && tags.every((t) => t === null)) return null;
  return computeTopGenres(artists.map((a, i) => ({ ...a, tags: tags[i] ?? [] })));
}

/** Scrobbles por página (máximo documentado do `user.getRecentTracks`). */
const SCROBBLES_PER_PAGE = 200;

/**
 * Intervalo já encerrado? Damos 1 dia de folga porque scrobbles atrasados
 * (de aparelho que estava offline) ainda podem chegar logo depois.
 */
export function isClosedRange(to: number, nowSeconds: number): boolean {
  return to < nowSeconds - 86_400;
}

/** Uma página de scrobbles entre `from` e `to`. Intervalo encerrado fica 1 dia em cache. */
export async function getScrobblePage(
  username: string,
  from: number,
  to: number,
  page: number,
): Promise<ScrobblePage> {
  const closed = isClosedRange(to, Date.now() / 1000);
  const raw = await callLastfm(
    "user.getRecentTracks",
    {
      user: username,
      from: String(from),
      to: String(to),
      limit: String(SCROBBLES_PER_PAGE),
      page: String(page),
    },
    closed ? "day" : "short",
  );
  return normalizeScrobblePage(raw);
}

const CHART_METHODS: Record<TopType, Method> = {
  artists: "user.getWeeklyArtistChart",
  albums: "user.getWeeklyAlbumChart",
  tracks: "user.getWeeklyTrackChart",
};

/** Itens devolvidos por gráfico (o bastante para lineup, grade 5x5, listas e gêneros). */
const CHART_LIMIT = 50;

/**
 * Tops de um intervalo qualquer, numa chamada só. Usa os gráficos "semanais" do Last.fm
 * com `from`/`to` livres (não documentado, mas testado: a soma bate com o total de
 * scrobbles; ver docs/LASTFM.md). Intervalo encerrado fica 1 dia em cache.
 */
export async function getChart(username: string, type: TopType, from: number, to: number): Promise<ChartResponse> {
  const closed = isClosedRange(to, Date.now() / 1000);
  const raw = await callLastfm(
    CHART_METHODS[type],
    { user: username, from: String(from), to: String(to) },
    closed ? "day" : "short",
  );
  return { type, from, to, items: normalizeChart(type, raw, CHART_LIMIT), totalPlays: sumChartPlays(type, raw) };
}

/**
 * Capa de um álbum (`album.getInfo`), com cache de 30 dias. Álbum que o Last.fm não
 * conhece (erro 6) devolve null em vez de erro.
 */
export async function getAlbumCover(artist: string, album: string): Promise<string | null> {
  try {
    const raw = await callLastfm("album.getInfo", { artist, album, autocorrect: "1" }, "month");
    return normalizeAlbumCover(raw);
  } catch (err) {
    if (err instanceof LastfmError && err.code === "USER_NOT_FOUND") return null;
    throw err;
  }
}

/**
 * Capa do álbum e duração de uma música (`track.getInfo`), para a lista "Músicas" (o top
 * de músicas só traz o placeholder) e a estimativa de minutos do recap. Música desconhecida
 * (o Last.fm às vezes responde erro 6) vira tudo null. Quase nunca muda: cache de 30 dias.
 */
export async function getTrackInfo(
  artist: string,
  track: string,
): Promise<{ imageUrl: string | null; durationSec: number | null; album: { title: string; artist: string } | null }> {
  try {
    const raw = await callLastfm("track.getInfo", { artist, track, autocorrect: "1" }, "month");
    return {
      imageUrl: normalizeTrackCover(raw),
      durationSec: normalizeTrackDuration(raw),
      album: normalizeTrackAlbum(raw),
    };
  } catch (err) {
    if (err instanceof LastfmError && err.code === "USER_NOT_FOUND") {
      return { imageUrl: null, durationSec: null, album: null };
    }
    throw err;
  }
}

/**
 * Capas "álbuns em alta no mundo" para a colagem da página inicial (SPEC, "Início"):
 * top 50 músicas global do Last.fm, o álbum de cada uma (3 por vez) e o ranking de álbuns
 * de src/lib/trending.ts. Guardado 1 dia para o site inteiro (não é por visitante).
 * Nunca lança erro: se o Last.fm falhar, devolve lista vazia por poucos minutos e a página
 * usa as formas abstratas.
 */
export async function getTrendingCovers(): Promise<{ covers: TrendingCover[]; updatedAt: number }> {
  "use cache";
  let covers: TrendingCover[] = [];
  try {
    const tracks = normalizeChartTracks(await callLastfm("chart.getTopTracks", { limit: "50" }, "day"));
    const infos = await mapWithLimit(tracks, TAGS_CONCURRENCY, async (t) => {
      try {
        return await getTrackInfo(t.artist, t.name);
      } catch {
        return null;
      }
    });
    covers = rankTrendingAlbums(
      infos.map((info) => ({
        album: info?.album?.title ?? null,
        albumArtist: info?.album?.artist ?? null,
        imageUrl: info?.imageUrl ?? null,
      })),
    );
  } catch {
    covers = [];
  }
  cacheLife(covers.length > 0 ? CACHE_PROFILES.day : { revalidate: 300, expire: 900 });
  return { covers, updatedAt: Date.now() };
}

/**
 * Capas da vitrine da página inicial: os álbuns escolhidos em src/data/vitrine.json, com a
 * capa de cada um (`album.getInfo`, 3 por vez, cache de 30 dias). Se menos de 4 capas
 * forem achadas, usa os álbuns em alta no mundo. Nunca lança erro.
 */
export async function getShowcaseCovers(): Promise<{
  covers: TrendingCover[];
  caption: string;
  updatedAt: number;
}> {
  "use cache";
  const { caption, items } = parseShowcase(vitrine);
  const images = await mapWithLimit(items, TAGS_CONCURRENCY, async (it) => {
    try {
      return await getAlbumCover(it.artist, it.album);
    } catch {
      return null;
    }
  });
  const covers = items.flatMap((it, i) => {
    const imageUrl = images[i];
    return imageUrl ? [{ imageUrl, name: it.album, artist: it.artist }] : [];
  });
  if (covers.length >= 4) {
    cacheLife(CACHE_PROFILES.day);
    return { covers, caption: caption || "em evidência", updatedAt: Date.now() };
  }
  // Faltou capa (nome errado ou Last.fm fora do ar): mostra os em alta e tenta de novo logo.
  cacheLife({ revalidate: 300, expire: 900 });
  const trending = await getTrendingCovers();
  return { ...trending, caption: "álbuns em alta no mundo hoje" };
}
