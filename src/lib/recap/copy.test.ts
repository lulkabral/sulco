import { describe, expect, it } from "vitest";
import { albumHeading, dateText, shortTag } from "./copy";

describe("albumHeading", () => {
  it("muda conforme o período", () => {
    expect(albumHeading("2026-10")).toBe("O álbum do mês");
    expect(albumHeading("overall")).toBe("O álbum da sua vida");
    expect(albumHeading("7day")).toBe("O álbum da semana");
    expect(albumHeading("12month")).toBe("O álbum do ano");
    expect(albumHeading("3month")).toBe("O álbum do período");
    expect(albumHeading("2025")).toBe("O álbum do ano");
  });
});

describe("shortTag", () => {
  it("mês vira 'OUT 26'; períodos têm rótulo próprio", () => {
    expect(shortTag("2026-10")).toBe("OUT 26");
    expect(shortTag("2019-03")).toBe("MAR 19");
    expect(shortTag("overall")).toBe("TUDO");
    expect(shortTag("7day")).toBe("7 DIAS");
    expect(shortTag("2025")).toBe("2025");
  });
});

describe("dateText", () => {
  const tz = "America/Sao_Paulo";
  it("Todo o tempo: desde o cadastro", () => {
    expect(dateText("overall", Date.UTC(2019, 2, 10, 15) / 1000, 1_794_600_000, tz)).toBe("desde março de 2019");
  });

  it("outros períodos: o intervalo", () => {
    const to = Date.UTC(2026, 10, 15, 15) / 1000;
    expect(dateText("7day", to - 7 * 86_400, to, tz)).toBe("8 – 15 nov 2026");
  });
});
