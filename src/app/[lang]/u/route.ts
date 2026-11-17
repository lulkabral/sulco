import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/i18n/config";

// GET /u?username=NOME -> redireciona para /u/NOME.
// É o destino do formulário da página inicial quando o JavaScript ainda não carregou
// (ou está desligado). Com JavaScript, o formulário navega direto, sem passar por aqui.
// Não registramos nada: este endereço está fora do log do `next dev` (next.config.ts).
export async function GET(request: NextRequest, { params }: RouteContext<"/[lang]/u">) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const username = (request.nextUrl.searchParams.get("username") ?? "").trim();
  const target = localePath(locale, username ? `/u/${encodeURIComponent(username)}` : "/");
  // A página /u/[username] valida o nome e mostra o erro, se houver.
  return Response.redirect(new URL(target, request.nextUrl.origin), 303);
}
