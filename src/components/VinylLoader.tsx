"use client";

import { useI18n } from "@/i18n/client";

const SIZES = { sm: "size-10", md: "size-20", lg: "size-28" } as const;

type Props = {
  /** Texto que aparece embaixo do disco (ex.: "Montando o recap…"). Sem ele, só "carregando…" quando o movimento está reduzido. */
  label?: string;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * Indicador de carregamento: um disco de vinil girando a 33⅓ rpm (CSS puro: sulcos com
 * repeating-radial-gradient, reflexo e selo âmbar no centro). É o único movimento
 * automático novo do site (docs/MARCA.md). Com "reduzir movimento", fica parado e o
 * texto "carregando…" aparece.
 */
export function VinylLoader({ label, size = "md", className = "" }: Props) {
  const { t } = useI18n();
  return (
    <div role="status" className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        aria-hidden
        className={`relative ${SIZES[size]} shrink-0 rounded-full shadow-lg shadow-black/50 ring-1 ring-white/10 motion-safe:animate-record`}
        style={{ background: "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)" }}
      >
        {/* Reflexo: é ele que mostra que o disco está girando. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 20deg, transparent 0 8%, rgba(255,255,255,0.18) 12%, transparent 17%, transparent 58%, rgba(255,255,255,0.1) 62%, transparent 67%)",
          }}
        />
        {/* Selo âmbar com o furo do pino. */}
        <div className="absolute inset-[33%] rounded-full bg-amber">
          <div className="absolute inset-[40%] rounded-full bg-room" />
        </div>
      </div>
      {label ? (
        <span className="text-center text-sm font-semibold text-soft">{label}</span>
      ) : (
        <span className="sr-only text-sm text-soft motion-reduce:not-sr-only">{t.common.loading}</span>
      )}
    </div>
  );
}
