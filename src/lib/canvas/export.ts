/** Converte o canvas em arquivo PNG. */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar o PNG"))),
      "image/png",
    );
  });
}

/** O aparelho sabe compartilhar arquivos pelo menu nativo? (Web Share API com arquivo) */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    const probe = new File([new Uint8Array(1)], "teste.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Baixa o arquivo pelo navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Dá tempo do download começar antes de liberar a memória.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Abre o menu de compartilhar do aparelho com a imagem.
 * Se não houver suporte, baixa. Se a pessoa fechar o menu, não faz nada.
 */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Outro erro (ex.: permissão): cai para o download.
    }
  }
  downloadBlob(blob, filename);
}
