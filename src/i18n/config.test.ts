import { describe, expect, it } from "vitest";
import { localePath, pickLocale, redirectLocale, stripLocale } from "./config";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36";

describe("localePath", () => {
  it("português fica sem prefixo", () => {
    expect(localePath("pt", "/u/ana")).toBe("/u/ana");
    expect(localePath("pt", "/")).toBe("/");
  });
  it("inglês e espanhol ganham prefixo", () => {
    expect(localePath("en", "/u/ana")).toBe("/en/u/ana");
    expect(localePath("es", "/")).toBe("/es");
  });
});

describe("stripLocale", () => {
  it("tira o prefixo", () => {
    expect(stripLocale("/en/u/ana")).toBe("/u/ana");
    expect(stripLocale("/es")).toBe("/");
    expect(stripLocale("/pt/privacidade")).toBe("/privacidade");
  });
  it("não mexe no que não é prefixo", () => {
    expect(stripLocale("/u/english")).toBe("/u/english");
    expect(stripLocale("/enx")).toBe("/enx");
  });
});

describe("pickLocale", () => {
  it("pega a primeira língua que o site tem", () => {
    expect(pickLocale("es-AR,es;q=0.9,en;q=0.8")).toBe("es");
    expect(pickLocale("fr-FR,fr;q=0.9,en-US;q=0.8")).toBe("en");
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });
  it("respeita o peso (q), não só a ordem", () => {
    expect(pickLocale("en;q=0.5,es;q=0.9")).toBe("es");
  });
  it("nenhuma conhecida ou vazio: null", () => {
    expect(pickLocale("fr,de")).toBeNull();
    expect(pickLocale("")).toBeNull();
    expect(pickLocale(null)).toBeNull();
  });
});

describe("redirectLocale", () => {
  it("navegador em espanhol vai para /es", () => {
    expect(redirectLocale({ cookie: undefined, acceptLanguage: "es-MX,es", userAgent: CHROME })).toBe("es");
  });
  it("navegador em português fica", () => {
    expect(redirectLocale({ cookie: undefined, acceptLanguage: "pt-BR", userAgent: CHROME })).toBeNull();
  });
  it("a escolha no seletor vence o navegador", () => {
    expect(redirectLocale({ cookie: "pt", acceptLanguage: "en-US", userAgent: CHROME })).toBeNull();
    expect(redirectLocale({ cookie: "es", acceptLanguage: "pt-BR", userAgent: CHROME })).toBe("es");
  });
  it("robô da prévia do link nunca é redirecionado", () => {
    expect(redirectLocale({ cookie: undefined, acceptLanguage: "en-US", userAgent: "Twitterbot/1.0" })).toBeNull();
    expect(redirectLocale({ cookie: undefined, acceptLanguage: "en", userAgent: "WhatsApp/2.23" })).toBeNull();
    expect(redirectLocale({ cookie: undefined, acceptLanguage: "en", userAgent: null })).toBeNull();
  });
  it("cookie com valor estranho é ignorado", () => {
    expect(redirectLocale({ cookie: "xx", acceptLanguage: "es", userAgent: CHROME })).toBe("es");
  });
});
