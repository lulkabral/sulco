"use client";

import { useI18n } from "@/i18n/client";
import { isCustomVinyl, VINYL_PRESETS, type VinylChoice } from "@/lib/vinyl-choice";
import { Swatch } from "./Swatch";

const RAINBOW = "conic-gradient(#ed6477, #f3b653, #85cc72, #60c7eb, #9875ed, #ed6477)";

export function VinylColorPicker({ value, color, onChange }: {
  value: VinylChoice;
  color: string | null;
  onChange: (value: VinylChoice) => void;
}) {
  const { t } = useI18n();
  const labels = t.recap.vinylChoices;
  const custom = isCustomVinyl(value);

  return (
    <fieldset className="min-w-0 border-t border-stage-line pt-3">
      <legend className="float-left mb-2 flex w-full items-baseline justify-between gap-2 text-sm font-bold text-stage-ink">
        <span>{t.recap.vinylColor}</span>
        <span className="text-right text-xs font-medium text-stage-soft">
          {custom ? value.toUpperCase() : labels[value]}
        </span>
      </legend>
      <div className="flex clear-both flex-wrap items-center">
        <Swatch label={labels.classic} active={value === "classic"} onClick={() => onChange("classic")} background="var(--color-vinyl)" />
        <Swatch label={labels.auto} active={value === "auto"} onClick={() => onChange("auto")}
          background="linear-gradient(135deg, var(--color-vinyl) 50%, var(--color-amber) 50%)" />
        {(Object.keys(VINYL_PRESETS) as (keyof typeof VINYL_PRESETS)[]).map((id) => (
          <Swatch key={id} label={labels[id]} active={value === id} onClick={() => onChange(id)} background={VINYL_PRESETS[id]} />
        ))}
        <label className="relative grid size-11 shrink-0 place-items-center rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber">
          <span aria-hidden className={`relative size-8 rounded-full sm:size-9 ${custom ? "ring-2 ring-amber" : "ring-1 ring-white/25"}`}
            style={{ background: RAINBOW }}>
            {custom && <span className="absolute inset-[23%] rounded-full border border-stage-line" style={{ background: value }} />}
          </span>
          <input
            type="color"
            aria-label={labels.custom}
            title={labels.custom}
            value={color ?? "#0b0a09"}
            onChange={(event) => {
              const selected = event.currentTarget.value;
              if (isCustomVinyl(selected)) onChange(selected);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </fieldset>
  );
}
