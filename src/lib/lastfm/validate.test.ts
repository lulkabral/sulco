import { describe, expect, it } from "vitest";
import { HTTP_STATUS, mapLastfmError } from "./errors";
import { validateLimit, validatePeriod, validateTopType, validateUsername } from "./validate";

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
