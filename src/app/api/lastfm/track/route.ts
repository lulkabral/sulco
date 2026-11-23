import type { NextRequest } from "next/server";
import { getDeezerTrackCover } from "@/lib/deezer-client";
import { getTrackInfo } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName, validateTrackName } from "@/lib/lastfm/validate";

// GET /api/lastfm/track?artist=NOME&track=NOME -> { imageUrl, durationSec }
// Capa do álbum da música (com fallback para a Deezer) e duração para estimar os minutos do recap.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const artist = validateArtistName(params.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);
  const track = validateTrackName(params.get("track"));
  if (!track.ok) return jsonError("BAD_REQUEST", track.message);

  try {
    const { imageUrl, durationSec } = await getTrackInfo(artist.value, track.value);
    const finalImageUrl = imageUrl ?? (await getDeezerTrackCover(artist.value, track.value));
    return jsonOk(
      { artist: artist.value, track: track.value, imageUrl: finalImageUrl, durationSec },
      finalImageUrl ? CACHE_SECONDS.month : CACHE_SECONDS.day,
      CACHE_SECONDS.day,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
