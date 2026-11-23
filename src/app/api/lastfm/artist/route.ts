import type { NextRequest } from "next/server";
import { getDeezerArtistPicture } from "@/lib/deezer-client";
import { getArtistCover } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName } from "@/lib/lastfm/validate";

// GET /api/lastfm/artist?name=NOME -> { artist, imageUrl }
// Foto oficial do artista (via busca pública da Deezer); sem foto lá, cai na capa do álbum mais popular no Last.fm.
export async function GET(request: NextRequest) {
  const artist = validateArtistName(request.nextUrl.searchParams.get("name"));
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
