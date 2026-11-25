import type { NextRequest } from "next/server";
import { getDeezerAlbumCover, getDeezerArtistPicture, getDeezerTrackCover } from "@/lib/deezer-client";
import {
  getAlbumCover,
  getArtistCover,
  getArtistTags,
  getChart,
  getScrobblePage,
  getTop,
  getTrackInfo,
  getUserInfo,
  isClosedRange,
  isGenreTag,
} from "@/lib/lastfm/client";
import { errorBody } from "@/lib/lastfm/errors";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import {
  MAX_YEAR_RANGE_SECONDS,
  validateAlbumName,
  validateArtistName,
  validateChartLimit,
  validateLimit,
  validatePage,
  validatePeriod,
  validateRange,
  validateTopType,
  validateTrackName,
  validateUsername,
} from "@/lib/lastfm/validate";

type EndpointHandler = (params: URLSearchParams) => Promise<Response>;

// GET /api/lastfm/user?user=USERNAME
async function handleUser(params: URLSearchParams): Promise<Response> {
  const user = validateUsername(params.get("user"));
  if (!user.ok) return jsonError("BAD_REQUEST", user.message);

  try {
    return jsonOk(await getUserInfo(user.value), CACHE_SECONDS.short);
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/top?user=USERNAME&type=artists|albums|tracks&period=7day&limit=10
async function handleTop(params: URLSearchParams): Promise<Response> {
  const user = validateUsername(params.get("user"));
  if (!user.ok) return jsonError("BAD_REQUEST", user.message);
  const type = validateTopType(params.get("type"));
  if (!type.ok) return jsonError("BAD_REQUEST", type.message);
  const period = validatePeriod(params.get("period"));
  if (!period.ok) return jsonError("BAD_REQUEST", period.message);
  const limit = validateLimit(params.get("limit"));
  if (!limit.ok) return jsonError("BAD_REQUEST", limit.message);

  try {
    const data = await getTop(user.value, type.value, period.value, limit.value);
    return jsonOk(data, CACHE_SECONDS.short);
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/scrobbles?user=USERNAME&from=TIMESTAMP&to=TIMESTAMP&page=1
async function handleScrobbles(params: URLSearchParams): Promise<Response> {
  const user = validateUsername(params.get("user"));
  if (!user.ok) return jsonError("BAD_REQUEST", user.message);
  const range = validateRange(params.get("from"), params.get("to"));
  if (!range.ok) return jsonError("BAD_REQUEST", range.message);
  const page = validatePage(params.get("page"));
  if (!page.ok) return jsonError("BAD_REQUEST", page.message);

  try {
    const { from, to } = range.value;
    const data = await getScrobblePage(user.value, from, to, page.value);
    const closed = isClosedRange(to, Date.now() / 1000);
    // Mês encerrado não muda: a CDN guarda 1 dia e o navegador 1 hora (trocar de aba fica instantâneo).
    return closed ? jsonOk(data, CACHE_SECONDS.day, 3600) : jsonOk(data, CACHE_SECONDS.short);
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/chart?user=USERNAME&type=artists|albums|tracks&from=TIMESTAMP&to=TIMESTAMP[&limit=200]
async function handleChart(params: URLSearchParams): Promise<Response> {
  const user = validateUsername(params.get("user"));
  if (!user.ok) return jsonError("BAD_REQUEST", user.message);
  const type = validateTopType(params.get("type"));
  if (!type.ok) return jsonError("BAD_REQUEST", type.message);
  const range = validateRange(params.get("from"), params.get("to"), MAX_YEAR_RANGE_SECONDS);
  if (!range.ok) return jsonError("BAD_REQUEST", range.message);
  const limit = validateChartLimit(params.get("limit"));
  if (!limit.ok) return jsonError("BAD_REQUEST", limit.message);

  try {
    const { from, to } = range.value;
    const data = await getChart(user.value, type.value, from, to, limit.value);
    // Intervalo encerrado não muda: CDN 1 dia, navegador 1 hora. Intervalo aberto: 10 min.
    return isClosedRange(to, Date.now() / 1000)
      ? jsonOk(data, CACHE_SECONDS.day, 3600)
      : jsonOk(data, CACHE_SECONDS.short);
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/tags?artist=NOME
async function handleTags(params: URLSearchParams): Promise<Response> {
  const artist = validateArtistName(params.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);

  try {
    return jsonOk(await getArtistTags(artist.value), CACHE_SECONDS.week, CACHE_SECONDS.day);
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/tag?name=TAG -> { tag, genre }: a tag parece gênero? (tag.getInfo)
async function handleTag(params: URLSearchParams): Promise<Response> {
  const tag = validateArtistName(params.get("name"));
  if (!tag.ok) return jsonError("BAD_REQUEST", tag.message);
  return jsonOk({ tag: tag.value, genre: await isGenreTag(tag.value) }, CACHE_SECONDS.month, CACHE_SECONDS.week);
}

// GET /api/lastfm/album?artist=NOME&album=NOME -> { artist, album, imageUrl }
async function handleAlbum(params: URLSearchParams): Promise<Response> {
  const artist = validateArtistName(params.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);
  const album = validateAlbumName(params.get("album"));
  if (!album.ok) return jsonError("BAD_REQUEST", album.message);

  try {
    const imageUrl = (await getAlbumCover(artist.value, album.value)) ?? (await getDeezerAlbumCover(artist.value, album.value));
    return jsonOk(
      { artist: artist.value, album: album.value, imageUrl },
      imageUrl ? CACHE_SECONDS.month : CACHE_SECONDS.day,
      CACHE_SECONDS.day,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/artist?name=NOME -> { artist, imageUrl }
async function handleArtist(params: URLSearchParams): Promise<Response> {
  const artist = validateArtistName(params.get("name"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);

  try {
    const imageUrl = (await getDeezerArtistPicture(artist.value)) ?? (await getArtistCover(artist.value));
    return jsonOk(
      { artist: artist.value, imageUrl },
      imageUrl ? CACHE_SECONDS.month : CACHE_SECONDS.day,
      CACHE_SECONDS.day,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

// GET /api/lastfm/track?artist=NOME&track=NOME -> { artist, track, imageUrl, durationSec, album }
async function handleTrack(params: URLSearchParams): Promise<Response> {
  const artist = validateArtistName(params.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);
  const track = validateTrackName(params.get("track"));
  if (!track.ok) return jsonError("BAD_REQUEST", track.message);

  try {
    const { imageUrl, durationSec, album } = await getTrackInfo(artist.value, track.value);
    const finalImageUrl = imageUrl ?? (await getDeezerTrackCover(artist.value, track.value));
    return jsonOk(
      {
        artist: artist.value,
        track: track.value,
        imageUrl: finalImageUrl,
        durationSec,
        album: album?.title ?? null,
      },
      finalImageUrl ? CACHE_SECONDS.month : CACHE_SECONDS.day,
      CACHE_SECONDS.day,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

/** Lista fechada de endpoints aceitos em `/api/lastfm/[endpoint]`. */
const HANDLERS: Record<string, EndpointHandler> = {
  user: handleUser,
  top: handleTop,
  scrobbles: handleScrobbles,
  chart: handleChart,
  tags: handleTags,
  tag: handleTag,
  album: handleAlbum,
  artist: handleArtist,
  track: handleTrack,
};

/**
 * Rota única para todos os endpoints de leitura `/api/lastfm/*`.
 * Mantém exatamente as mesmas URLs, validações e tempos de cache, reduzindo
 * de 9 para 1 função de servidor (Vercel Function) por deploy.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ endpoint: string }> },
): Promise<Response> {
  const { endpoint } = await context.params;
  if (!Object.hasOwn(HANDLERS, endpoint)) {
    return Response.json(errorBody("BAD_REQUEST", "Endpoint não encontrado."), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return HANDLERS[endpoint](request.nextUrl.searchParams);
}
