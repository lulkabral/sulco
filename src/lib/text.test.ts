import { describe, expect, it } from "vitest";
import { normalizeName } from "@/lib/text";

describe("normalizeName", () => {
  it("passa para minúsculas e tira espaços das pontas", () => {
    expect(normalizeName("  Rock ")).toBe("rock");
  });

  it("junta espaços repetidos", () => {
    expect(normalizeName("Hip   Hop")).toBe("hip hop");
  });

  it("mantém texto vazio como vazio", () => {
    expect(normalizeName("   ")).toBe("");
  });
});
