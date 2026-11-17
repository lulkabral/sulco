import type { NextRequest } from "next/server";
import { isGenreTag } from "@/lib/lastfm/client";
import { CACHE_SECONDS, jsonError, jsonOk } from "@/lib/lastfm/http";
import { validateArtistName } from "@/lib/lastfm/validate";

// GET /api/lastfm/tag?name=TAG -> { tag, genre }: a tag parece gênero? (tag.getInfo)
// Usada pela vista de ano, que monta os gêneros no navegador. Nunca dá erro: na dúvida, true.
export async function GET(request: NextRequest) {
  // Mesmas regras de tamanho e caracteres do nome de artista.
  const tag = validateArtistName(request.nextUrl.searchParams.get("name"));
  if (!tag.ok) return jsonError("BAD_REQUEST", tag.message);
  return jsonOk({ tag: tag.value, genre: await isGenreTag(tag.value) }, CACHE_SECONDS.month, CACHE_SECONDS.week);
}
