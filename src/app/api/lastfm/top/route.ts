import type { NextRequest } from "next/server";
import { getTop } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import {
  validateLimit,
  validatePeriod,
  validateTopType,
  validateUsername,
} from "@/lib/lastfm/validate";

// GET /api/lastfm/top?user=USERNAME&type=artists|albums|tracks&period=7day&limit=10
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

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
