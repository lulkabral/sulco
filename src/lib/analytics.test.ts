import { describe, expect, it } from "vitest";
import { optedOut, sanitizeUrl } from "./analytics";

const site = "https://sulcofm.vercel.app";

describe("sanitizeUrl", () => {
  it("troca o username por [perfil]", () => {
    expect(sanitizeUrl(`${site}/u/luaulp`)).toBe(`${site}/u/[perfil]`);
    expect(sanitizeUrl(`${site}/u/Fulano_123/qualquer`)).toBe(`${site}/u/[perfil]`);
  });

  it("descarta parâmetros e âncora", () => {
    expect(sanitizeUrl(`${site}/u/luaulp?tab=grid&period=2026-10`)).toBe(`${site}/u/[perfil]`);
    expect(sanitizeUrl(`${site}/u?username=luaulp`)).toBe(`${site}/u`);
    expect(sanitizeUrl(`${site}/?x=1#topo`)).toBe(`${site}/`);
  });

  it("mantém as outras páginas", () => {
    expect(sanitizeUrl(`${site}/privacidade`)).toBe(`${site}/privacidade`);
  });

  it("endereço inválido não é enviado", () => {
    expect(sanitizeUrl("não é url")).toBeNull();
  });
});

describe("optedOut", () => {
  it("respeita Do Not Track e Global Privacy Control", () => {
    expect(optedOut({ doNotTrack: "1" })).toBe(true);
    expect(optedOut({ globalPrivacyControl: true })).toBe(true);
    expect(optedOut({ doNotTrack: "0", globalPrivacyControl: false })).toBe(false);
    expect(optedOut(undefined)).toBe(false);
  });
});
