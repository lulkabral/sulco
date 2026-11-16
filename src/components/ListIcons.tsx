/** Ícones dos títulos das listas (decorativos: o título já diz o que é). */

export type ListIconName = "artists" | "tracks" | "albums" | "genres";

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-4 shrink-0 text-amber",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ListIcon({ name }: { name: ListIconName }) {
  switch (name) {
    case "artists": // microfone
      return (
        <svg {...iconProps}>
          <rect x="9" y="2.5" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4M8.5 21.5h7" />
        </svg>
      );
    case "tracks": // nota musical
      return (
        <svg {...iconProps}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      );
    case "albums": // disco
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M16.5 7.5a6.5 6.5 0 0 1 1.5 3" />
        </svg>
      );
    case "genres": // etiqueta
      return (
        <svg {...iconProps}>
          <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </svg>
      );
  }
}
