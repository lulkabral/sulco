"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasToPng } from "./export";

/**
 * Cópia em PNG do que está no canvas, para mostrar como <img>. Com uma imagem de verdade
 * na tela, segurar o dedo nela abre o menu do celular ("Salvar imagem", "Compartilhar").
 * Num <canvas> esse menu não aparece.
 *
 * `take(canvas)` gera o PNG depois de cada desenho; o endereço anterior é liberado.
 * Enquanto o PNG novo é gerado, a tela mostra o próprio canvas (já com o desenho novo).
 */
export function useCanvasSnapshot() {
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef<string | null>(null);
  const version = useRef(0);

  const take = useCallback(async (canvas: HTMLCanvasElement) => {
    const mine = ++version.current;
    // Tira a cópia antiga já: por baixo dela o canvas mostra o desenho novo.
    setUrl(null);
    const blob = await canvasToPng(canvas);
    // Outro desenho começou enquanto este virava PNG: fica o mais novo.
    if (mine !== version.current) return;
    const next = URL.createObjectURL(blob);
    if (current.current) URL.revokeObjectURL(current.current);
    current.current = next;
    setUrl(next);
  }, []);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  return [url, take] as const;
}
