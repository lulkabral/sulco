import type { NextRequest } from "next/server";
import { getUserInfo } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateUsername } from "@/lib/lastfm/validate";

// GET /api/lastfm/user?user=USERNAME
export async function GET(request: NextRequest) {
  const user = validateUsername(request.nextUrl.searchParams.get("user"));
  if (!user.ok) return jsonError("BAD_REQUEST", user.message);

  try {
    return jsonOk(await getUserInfo(user.value), CACHE_SECONDS.short);
  } catch (err) {
    return handleRouteError(err);
  }
}
