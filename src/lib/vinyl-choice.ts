export const VINYL_PRESETS = {
  amber: "#E8A13A",
  blue: "#58B8FF",
  pink: "#FF5BB2",
  green: "#36D699",
  lilac: "#A875FF",
  cream: "#F5E5C8",
} as const;

export type VinylChoice = "classic" | "auto" | keyof typeof VINYL_PRESETS | `#${string}`;

export function isCustomVinyl(value: unknown): value is `#${string}` {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function parseVinylChoice(value: unknown, legacyColored: unknown): VinylChoice {
  if (isCustomVinyl(value) || value === "auto" || value === "classic") return value;
  if (typeof value === "string" && isVinylPreset(value)) return value;
  return legacyColored === true ? "auto" : "classic";
}

function isVinylPreset(value: string): value is keyof typeof VINYL_PRESETS {
  return Object.hasOwn(VINYL_PRESETS, value);
}

export function resolveVinylColor(choice: VinylChoice, automaticColor: string | null): string | null {
  if (choice === "classic") return null;
  if (choice === "auto") return automaticColor;
  return isCustomVinyl(choice) ? choice : VINYL_PRESETS[choice];
}
