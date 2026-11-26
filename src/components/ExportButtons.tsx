"use client";

import { useState, useSyncExternalStore, type RefObject } from "react";
import {
  canCopyImage,
  canShareFiles,
  canvasToPng,
  canvasToShareFile,
  copyImage,
  downloadBlob,
  shareOrDownload,
} from "@/lib/canvas/export";
import { useI18n } from "@/i18n/client";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  filename: string;
  /** Título enviado ao menu de compartilhar. */
  shareTitle: string;
  /** Desliga os botões enquanto a imagem é desenhada. */
  disabled: boolean;
};

// O que o aparelho sabe fazer não muda durante a visita: "assina" sem nunca avisar mudança.
const subscribeNever = () => () => {};

/**
 * "Baixar imagem" e "Compartilhar", lado a lado. Usado pela grade e pelo recap.
 * Compartilhar abre o menu do celular; no computador (sem esse menu) copia a imagem
 * para colar onde quiser; sem nenhum dos dois, baixa.
 */
export function ExportButtons({ canvasRef, filename, shareTitle, disabled }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(subscribeNever, canShareFiles, () => false);
  const canCopy = useSyncExternalStore(subscribeNever, canCopyImage, () => false);

  async function handle(action: "download" | "share") {
    if (!canvasRef.current) return;
    setBusy(true);
    setCopyFallback(false);
    try {
      const canvas = canvasRef.current;
      if (action === "share" && !canShare && canCopy) {
        // Copiar: a área de transferência só aceita PNG.
        const png = await canvasToPng(canvas);
        try {
          await copyImage(png);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          const file = await canvasToShareFile(canvas, filename);
          downloadBlob(file.blob, file.name);
          setCopyFallback(true);
        }
        return;
      }
      // Baixar e compartilhar: PNG até 5 MB; acima disso, JPEG de alta qualidade (limite do X).
      const file = await canvasToShareFile(canvas, filename);
      if (action === "share" && canShare) await shareOrDownload(file.blob, file.name, shareTitle);
      else downloadBlob(file.blob, file.name);
    } finally {
      setBusy(false);
    }
  }

  const base =
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-3 text-sm font-bold transition duration-200 ease-smooth active:scale-[0.98] disabled:opacity-50";
  const shareLabel = copied ? t.export.copied : canShare || !canCopy ? t.export.share : t.export.copy;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => handle("download")}
        disabled={disabled || busy}
        className={`${base} bg-amber text-amber-ink hover:bg-amber-hover`}
      >
        <DownloadIcon />
        {t.export.download}
      </button>
      <button
        type="button"
        onClick={() => handle("share")}
        disabled={disabled || busy}
        className={`${base} border border-stage-line text-stage-ink hover:border-stage-faint`}
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
        <span aria-live="polite">{shareLabel}</span>
      </button>
      <p role="status" className="col-span-2 text-center text-xs text-stage-soft empty:hidden">{copyFallback && t.export.copyFallback}</p>
    </div>
  );
}

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-4 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function DownloadIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M7 12H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
