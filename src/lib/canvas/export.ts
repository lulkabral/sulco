/** Converte o canvas em arquivo (PNG por padrão; JPEG com `quality` de 0 a 1). */
function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))), type, quality);
  });
}

/** Converte o canvas em arquivo PNG (usado para copiar: a área de transferência só aceita PNG). */
export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return canvasToBlob(canvas, "image/png");
}

/** Maior arquivo que o X aceita em imagem (5 MB). */
export const MAX_SHARE_BYTES = 5 * 1024 * 1024;
/** Qualidade do JPEG quando o PNG passa do limite: alta, sem perda visível. */
const JPEG_QUALITY = 0.92;

/**
 * Arquivo para baixar e compartilhar. As imagens saem ampliadas (1,5x no recap, 2400 px na grade): em PNG (texto mais nítido) quando
 * cabem em 5 MB; acima disso (ex.: grade 3x3 com capas originais, ~8 MB em PNG), em JPEG 92%,
 * para o X e outros apps aceitarem. Devolve também o nome com a extensão certa.
 */
export async function canvasToShareFile(canvas: HTMLCanvasElement, filename: string): Promise<{ blob: Blob; name: string }> {
  const png = await canvasToPng(canvas);
  if (png.size <= MAX_SHARE_BYTES) return { blob: png, name: filename };
  const jpeg = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  return { blob: jpeg, name: jpegName(filename) };
}

/** Troca a extensão do nome do arquivo para .jpg. Pura, com teste. */
export function jpegName(filename: string): string {
  return /\.png$/i.test(filename) ? filename.replace(/\.png$/i, ".jpg") : `${filename}.jpg`;
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

/** O navegador sabe copiar imagem para a área de transferência? (computador, em geral) */
export function canCopyImage(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

/** Copia a imagem para a área de transferência (para colar no X, WhatsApp Web etc.). */
export async function copyImage(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
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
  const file = new File([blob], filename, { type: blob.type || "image/png" });
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
