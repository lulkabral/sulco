import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, localePath, redirectLocale } from "@/i18n/config";

// Língua pelo endereço: /en/... e /es/... são inglês e espanhol; o resto é português,
// servido de /pt/... por baixo dos panos (o endereço na barra não muda).
// Quem chega num endereço em português com o navegador em inglês ou espanhol (e não
// escolheu língua no rodapé) é mandado para a versão na língua dele.
// Nada aqui é registrado; o cookie só guarda "pt", "en" ou "es".
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  // Já tem língua no endereço.
  if (first === "en" || first === "es" || first === "pt") return NextResponse.next();

  const target = redirectLocale({
    cookie: request.cookies.get(LANG_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    userAgent: request.headers.get("user-agent"),
  });
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(target, pathname);
    url.search = search;
    // 307: temporário (depende do navegador de cada um; não pode ficar em cache).
    return NextResponse.redirect(url, 307);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/pt${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Só páginas: fora as rotas da API, os arquivos do Next e tudo com extensão (ícones, imagens).
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
