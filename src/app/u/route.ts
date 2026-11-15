import type { NextRequest } from "next/server";

// GET /u?username=NOME -> redireciona para /u/NOME.
// É o destino do formulário da página inicial quando o JavaScript ainda não carregou
// (ou está desligado). Com JavaScript, o formulário navega direto, sem passar por aqui.
// Não registramos nada: este endereço está fora do log do `next dev` (next.config.ts).
export function GET(request: NextRequest) {
  const username = (request.nextUrl.searchParams.get("username") ?? "").trim();
  const target = username ? `/u/${encodeURIComponent(username)}` : "/";
  // A página /u/[username] valida o nome e mostra o erro, se houver.
  return Response.redirect(new URL(target, request.nextUrl.origin), 303);
}
