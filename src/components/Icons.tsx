// Ícones vetoriais simples que substituem símbolos Unicode (↗, ▶)
// para evitar que o Safari no iOS os renderize como emoji colorido.

type IconProps = {
  className?: string;
};

/** Seta diagonal para cima/direita (substitui ↗). */
export function ArrowUpRightIcon({ className = "size-3.5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <path
        d="M3.25 8.75 8.75 3.25M4.25 3.25h4.5v4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Triângulo de reproduzir (substitui ▶). */
export function PlayIcon({ className = "size-3" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
    >
      <path d="M3 2.2a.6.6 0 0 1 .9-.52l6.1 3.8a.6.6 0 0 1 0 1.04l-6.1 3.8A.6.6 0 0 1 3 9.8V2.2Z" />
    </svg>
  );
}
