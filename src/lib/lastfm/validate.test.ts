import { describe, expect, it } from "vitest";
import { HTTP_STATUS, mapLastfmError } from "./errors";
import {
  MAX_YEAR_RANGE_SECONDS,
  validateAlbumName,
  validateArtistName,
  validateLimit,
  validatePage,
  validateRange,
  validatePeriod,
  validateTopType,
  validateUsername,
} from "./validate";

describe("validateUsername", () => {
  it.each(["exemplo", "Ab", "user_name-1", "a12345678901234"])("aceita %s", (name) => {
    expect(validateUsername(name)).toEqual({ ok: true, value: name });
  });

  it("tira espaços das pontas", () => {
    expect(validateUsername("  exemplo ")).toEqual({ ok: true, value: "exemplo" });
  });

  it.each([null, "", "a", "1abc", "a123456789012345", "com espaço", "x/../y", "ação", "a&b=c"])(
    "recusa %s",
    (name) => {
      expect(validateUsername(name).ok).toBe(false);
    },
  );
});

describe("validateTopType", () => {
  it("aceita só artists, albums e tracks", () => {
    expect(validateTopType("albums")).toEqual({ ok: true, value: "albums" });
    expect(validateTopType("tags").ok).toBe(false);
    expect(validateTopType(null).ok).toBe(false);
  });
});

describe("validatePeriod", () => {
  it("usa 7day quando não vem nada", () => {
    expect(validatePeriod(null)).toEqual({ ok: true, value: "7day" });
    expect(validatePeriod("")).toEqual({ ok: true, value: "7day" });
  });

  it("aceita os períodos da API", () => {
    expect(validatePeriod("12month")).toEqual({ ok: true, value: "12month" });
  });

  it("recusa período inválido (o Last.fm devolveria overall sem avisar)", () => {
    expect(validatePeriod("2day").ok).toBe(false);
  });
});

describe("validateLimit", () => {
  it("usa 10 quando não vem nada", () => {
    expect(validateLimit(null)).toEqual({ ok: true, value: 10 });
  });

  it("aceita de 1 a 50", () => {
    expect(validateLimit("1")).toEqual({ ok: true, value: 1 });
    expect(validateLimit("50")).toEqual({ ok: true, value: 50 });
  });

  it.each(["0", "51", "-1", "2.5", "abc", "1e2"])("recusa %s", (raw) => {
    expect(validateLimit(raw).ok).toBe(false);
  });
});

describe("mapLastfmError", () => {
  it("segue a tabela do docs/LASTFM.md", () => {
    expect(mapLastfmError(6)).toBe("USER_NOT_FOUND");
    expect(mapLastfmError(17)).toBe("PRIVATE_PROFILE");
    expect(mapLastfmError(29)).toBe("RATE_LIMITED");
    for (const n of [10, 11, 16, 26, 999]) expect(mapLastfmError(n)).toBe("LASTFM_DOWN");
  });

  it("cada código tem um status HTTP", () => {
    expect(HTTP_STATUS.USER_NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
  });
});

describe("validateArtistName", () => {
  it("aceita nomes com acento, espaço e símbolos", () => {
    expect(validateArtistName(" Sigur Rós ")).toEqual({ ok: true, value: "Sigur Rós" });
    expect(validateArtistName("AC/DC")).toEqual({ ok: true, value: "AC/DC" });
  });

  it("recusa vazio, longo demais e caractere de controle", () => {
    expect(validateArtistName(null).ok).toBe(false);
    expect(validateArtistName("   ").ok).toBe(false);
    expect(validateArtistName("a".repeat(201)).ok).toBe(false);
    expect(validateArtistName("a\nb").ok).toBe(false);
  });
});

describe("validateRange", () => {
  const oct1 = 1_790_823_600; // 1/10/2026 00:00 em São Paulo
  const nov1 = 1_793_502_000;

  it("aceita um mês", () => {
    expect(validateRange(String(oct1), String(nov1 - 1))).toEqual({
      ok: true,
      value: { from: oct1, to: nov1 - 1 },
    });
  });

  it("recusa intervalo maior que 32 dias", () => {
    expect(validateRange(String(oct1), String(oct1 + 33 * 86_400)).ok).toBe(false);
  });

  it.each([
    [null, "2"],
    ["abc", "2"],
    ["-5", "10"],
    ["100", "200"], // antes de 2002
    [String(nov1), String(oct1)], // invertido
    ["1790823600.5", "1793502000"],
  ])("recusa from=%s to=%s", (from, to) => {
    expect(validateRange(from, to).ok).toBe(false);
  });
});

describe("validatePage", () => {
  it("padrão 1, aceita até 50", () => {
    expect(validatePage(null)).toEqual({ ok: true, value: 1 });
    expect(validatePage("50")).toEqual({ ok: true, value: 50 });
  });

  it.each(["0", "51", "abc", "1.5", "-1"])("recusa %s", (raw) => {
    expect(validatePage(raw).ok).toBe(false);
  });
});

describe("validateRange com máximo de 1 ano", () => {
  const jan1 = 1_767_236_400; // 1/1/2026 00:00 em São Paulo

  it("aceita um ano inteiro", () => {
    expect(validateRange(String(jan1), String(jan1 + 365 * 86_400 - 1), MAX_YEAR_RANGE_SECONDS).ok).toBe(true);
  });

  it("recusa mais de 367 dias", () => {
    expect(validateRange(String(jan1), String(jan1 + 368 * 86_400), MAX_YEAR_RANGE_SECONDS).ok).toBe(false);
  });

  it("sem o máximo, continua limitado a 32 dias", () => {
    expect(validateRange(String(jan1), String(jan1 + 40 * 86_400)).ok).toBe(false);
  });
});

describe("validateAlbumName", () => {
  it("mesmas regras do nome de artista", () => {
    expect(validateAlbumName(" Dookie ")).toEqual({ ok: true, value: "Dookie" });
    expect(validateAlbumName("").ok).toBe(false);
  });
});
