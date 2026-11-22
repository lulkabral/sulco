import type { NextRequest } from "next/server";
import { getChart, isClosedRange } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import {
  MAX_YEAR_RANGE_SECONDS,
  validateChartLimit,
  validateRange,
  validateTopType,
  validateUsername,
} from "@/lib/lastfm/validate";

// GET /api/lastfm/chart?user=USERNAME&type=artists|albums|tracks&from=TIMESTAMP&to=TIMESTAMP[&limit=200]
// Tops de um intervalo de até 1 ano, numa chamada só (ano inteiro e comparação de período anterior).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

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
