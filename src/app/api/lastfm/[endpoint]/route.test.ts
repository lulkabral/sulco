import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "./route";

function call(endpoint: string, query = "") {
  const url = `http://localhost:3000/api/lastfm/${endpoint}${query ? `?${query}` : ""}`;
  return GET(new NextRequest(url), { params: Promise.resolve({ endpoint }) });
}

describe("GET /api/lastfm/[endpoint]", () => {
  it("devolve 404 para endpoints fora da lista fechada (inclusive chaves de protótipo)", async () => {
    for (const bad of ["unknown", "constructor", "toString", "__proto__", ""]) {
      const res = await call(bad);
      expect(res.status).toBe(404);
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("roteia todos os endpoints aceitos e valida parâmetros obrigatórios com 400 BAD_REQUEST", async () => {
    const endpoints = ["user", "top", "scrobbles", "chart", "tags", "tag", "album", "artist", "track"];
    for (const ep of endpoints) {
      const res = await call(ep);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: { code?: string } };
      expect(body.error?.code).toBe("BAD_REQUEST");
    }
  });
});
