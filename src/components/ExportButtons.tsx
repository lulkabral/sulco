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

  const base =
    "rounded-lg px-4 py-2.5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50";
  const primary = `${base} bg-indigo-600 text-white hover:bg-indigo-700`;
  const secondary = `${base} border border-zinc-300 hover:border-zinc-500 dark:border-zinc-700`;

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
