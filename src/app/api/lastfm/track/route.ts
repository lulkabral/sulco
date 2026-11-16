import type { NextRequest } from "next/server";
import { getTrackCover } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName, validateTrackName } from "@/lib/lastfm/validate";

// GET /api/lastfm/track?artist=NOME&track=NOME -> { imageUrl }
// Só a capa do álbum da música (o top de músicas não traz imagem). Cache de 30 dias.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const artist = validateArtistName(params.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);
  const track = validateTrackName(params.get("track"));
  if (!track.ok) return jsonError("BAD_REQUEST", track.message);

  try {
    const imageUrl = await getTrackCover(artist.value, track.value);
    return jsonOk({ artist: artist.value, track: track.value, imageUrl }, CACHE_SECONDS.month, CACHE_SECONDS.day);
  } catch (err) {
    return handleRouteError(err);
  }
}
