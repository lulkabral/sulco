import { describe, expect, it } from "vitest";
import { jpegName, MAX_SHARE_BYTES } from "./export";

describe("jpegName", () => {
  it("troca .png por .jpg", () => {
    expect(jpegName("grade-30dias-3x3.png")).toBe("grade-30dias-3x3.jpg");
    expect(jpegName("RECAP.PNG")).toBe("RECAP.jpg");
    expect(jpegName("recap")).toBe("recap.jpg");
  });

  it("o limite é o do X (5 MB)", () => {
    expect(MAX_SHARE_BYTES).toBe(5 * 1024 * 1024);
  });
});
