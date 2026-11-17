import type { NextRequest } from "next/server";
import { getArtistCover } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName } from "@/lib/lastfm/validate";

// GET /api/lastfm/artist?name=NOME -> { artist, imageUrl }
// Capa do álbum mais popular do artista, para a bolinha da lista quando o período não deu
// nenhuma capa dele. Capas quase nunca mudam: cache de 30 dias.
export async function GET(request: NextRequest) {
  const artist = validateArtistName(request.nextUrl.searchParams.get("name"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);

  try {
    const imageUrl = await getArtistCover(artist.value);
    return jsonOk({ artist: artist.value, imageUrl }, CACHE_SECONDS.month, CACHE_SECONDS.day);
  } catch (err) {
    return handleRouteError(err);
  }
}
