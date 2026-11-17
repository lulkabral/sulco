import { describe, expect, it } from "vitest";
import { DICTS } from "./index";

/** Caminhos de todas as chaves de um objeto ("home.title", "privacy.sections"...). */
function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("dicionários", () => {
  const ptKeys = keys(DICTS.pt).sort();

  it.each(["en", "es"] as const)("%s tem exatamente as mesmas chaves do português", (lang) => {
    expect(keys(DICTS[lang]).sort()).toEqual(ptKeys);
  });

  it.each(["pt", "en", "es"] as const)("%s: 12 meses e as mesmas seções de privacidade", (lang) => {
    expect(DICTS[lang].periods.monthsShort).toHaveLength(12);
    expect(DICTS[lang].privacy.sections).toHaveLength(DICTS.pt.privacy.sections.length);
  });

  it.each(["pt", "en", "es"] as const)("%s: nenhum texto vazio", (lang) => {
    const strings: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (typeof v === "object" && v !== null) Object.values(v).forEach(walk);
    };
    walk(DICTS[lang]);
    expect(strings.filter((s) => s.trim() === "")).toEqual([]);
  });

  it("textos com número funcionam nas três línguas", () => {
    expect(DICTS.pt.units.plays("1", 1)).toBe("1 reprodução");
    expect(DICTS.en.units.plays("25", 25)).toBe("25 plays");
    expect(DICTS.es.units.plays("1", 1)).toBe("1 reproducción");
  });
});
