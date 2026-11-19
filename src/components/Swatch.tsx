"use client";

/** Bolinha de cor (metade fundo, metade destaque da paleta). Também usada no palco da página inicial. */
export function Swatch({
  label,
  active,
  onClick,
  background,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  background: string;
  disabled?: boolean;
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
        "size-10 rounded-full ring-offset-2 ring-offset-card transition active:scale-90 disabled:opacity-35 " +
        (active ? "ring-2 ring-amber" : "ring-1 ring-line hover:ring-ink-faint")
      }
      style={{ background }}
    />
  );
}
