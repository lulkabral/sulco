import type { NextRequest } from "next/server";
import { getArtistTags } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName } from "@/lib/lastfm/validate";

// GET /api/lastfm/tags?artist=NOME
export async function GET(request: NextRequest) {
  const artist = validateArtistName(request.nextUrl.searchParams.get("artist"));
  if (!artist.ok) return jsonError("BAD_REQUEST", artist.message);

  try {
    return jsonOk(await getArtistTags(artist.value), CACHE_SECONDS.week, CACHE_SECONDS.day);
  } catch (err) {
    return handleRouteError(err);
  }
}
