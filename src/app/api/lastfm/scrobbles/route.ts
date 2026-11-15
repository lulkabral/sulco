import type { NextRequest } from "next/server";
import { getScrobblePage, isClosedRange } from "@/lib/lastfm/client";
import { CACHE_SECONDS, handleRouteError, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validatePage, validateRange, validateUsername } from "@/lib/lastfm/validate";

// GET /api/lastfm/scrobbles?user=USERNAME&from=TIMESTAMP&to=TIMESTAMP&page=1
// O navegador pede as páginas e soma (fase 6). Intervalo de até 32 dias, até 50 páginas.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

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
