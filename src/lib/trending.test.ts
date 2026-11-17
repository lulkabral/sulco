import { describe, expect, it } from "vitest";
import { pickTrendingCovers } from "./trending";

describe("pickTrendingCovers", () => {
  const tracks = [
    { name: "A", artist: "X", imageUrl: "a.png" },
    { name: "B", artist: "X", imageUrl: "a.png" },
    { name: "C", artist: "Y", imageUrl: null },
    { name: "D", artist: "Z", imageUrl: "d.png" },
    { name: "E", artist: "W", imageUrl: "e.png" },
  ];

  it("tira repetidas e sem capa, mantendo a ordem do top", () => {
    expect(pickTrendingCovers(tracks).map((c) => c.name)).toEqual(["A", "D", "E"]);
  });

  it("para no máximo pedido", () => {
    expect(pickTrendingCovers(tracks, 2)).toHaveLength(2);
  });
});
