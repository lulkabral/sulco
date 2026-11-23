import type { NextRequest } from "next/server";
import { getDeezerAlbumCover } from "@/lib/deezer-client";
import { getAlbumCover } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateAlbumName, validateArtistName } from "@/lib/lastfm/validate";

// GET /api/lastfm/album?artist=NOME&album=NOME -> { artist, album, imageUrl }
// Capa do álbum (o gráfico do ano não traz imagens); se o Last.fm não tiver capa, recorre à Deezer.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
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
