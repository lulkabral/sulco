"use client";

import { useState, useSyncExternalStore, type RefObject } from "react";
import { canShareFiles, canvasToPng, downloadBlob, shareOrDownload } from "@/lib/canvas/export";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  filename: string;
  /** Título enviado ao menu de compartilhar. */
  shareTitle: string;
  /** Desliga os botões enquanto a imagem é desenhada. */
  disabled: boolean;
};

// Web Share não muda durante a visita: "assina" sem nunca avisar mudança.
const subscribeNever = () => () => {};

/**
 * Botões "Compartilhar" (só onde o aparelho aceita compartilhar arquivos)
 * e "Baixar PNG". Usado pela grade e pelo recap.
 */
export function ExportButtons({ canvasRef, filename, shareTitle, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const canShare = useSyncExternalStore(subscribeNever, canShareFiles, () => false);

  async function handleExport(share: boolean) {
    if (!canvasRef.current) return;
    setBusy(true);
    try {
      const blob = await canvasToPng(canvasRef.current);
      if (share) await shareOrDownload(blob, filename, shareTitle);
      else downloadBlob(blob, filename);
    } finally {
      setBusy(false);
    }
  }

  const base = "rounded-xl px-5 py-2.5 font-bold transition active:scale-95 disabled:opacity-50";
  const primary = `${base} bg-amber text-amber-ink hover:bg-amber-hover`;
  const secondary = `${base} border border-line text-ink hover:border-ink-faint`;

  return (
    <div className="flex flex-wrap gap-2">
      {canShare && (
        <button
          type="button"
          onClick={() => handleExport(true)}
          disabled={disabled || busy}
          className={primary}
        >
          Compartilhar
        </button>
      )}
      <button
        type="button"
        onClick={() => handleExport(false)}
        disabled={disabled || busy}
        className={canShare ? secondary : primary}
      >
        Baixar PNG
      </button>
    </div>
  );
}
