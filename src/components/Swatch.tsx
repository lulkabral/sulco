"use client";

/** Bolinha de cor (metade fundo, metade destaque da paleta). Também usada no palco da página inicial. */
export function Swatch({
  label,
  active,
  onClick,
  background,
  disabled = false,
  compact = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  background: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-full ring-offset-2 ring-offset-stage-card transition duration-200 ease-smooth hover:scale-[1.06] active:scale-[0.95] disabled:opacity-35 " +
        (compact ? "size-8 lg:size-7 " : "size-8 sm:size-9 ") +
        (active ? "ring-2 ring-amber" : "ring-1 ring-white/25 hover:ring-stage-ink")
      }
      style={{ background }}
    />
  );
}
