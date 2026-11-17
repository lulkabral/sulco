"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasToPng } from "./export";

/** Espera a pessoa parar de trocar opções antes de gerar o PNG (gerar a cada clique pesa). */
const DEBOUNCE_MS = 350;

/** Tela de toque (celular, tablet): só nela "segurar a imagem para salvar" existe. */
function isTouchScreen(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Cópia em PNG do que está no canvas, para mostrar como <img>. Com uma imagem de verdade
 * na tela, segurar o dedo nela abre o menu do celular ("Salvar imagem", "Compartilhar").
 * Num <canvas> esse menu não aparece.
 *
 * `take(canvas)` pede a cópia depois de um desenho. Para não pesar:
 * - só em tela de toque (no computador, segurar a imagem não faz nada, e baixar usa o canvas);
 * - só depois de a pessoa parar de mexer por um instante (trocas seguidas geram uma cópia só).
 * Enquanto isso, a tela mostra o próprio canvas (já com o desenho novo).
 */
export function useCanvasSnapshot() {
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef<string | null>(null);
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const take = useCallback((canvas: HTMLCanvasElement) => {
    if (!isTouchScreen()) return;
    const mine = ++version.current;
    // Tira a cópia antiga já: por baixo dela o canvas mostra o desenho novo.
    setUrl(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const blob = await canvasToPng(canvas);
      // Outro desenho começou enquanto este virava PNG: fica o mais novo.
      if (mine !== version.current) return;
      const next = URL.createObjectURL(blob);
      if (current.current) URL.revokeObjectURL(current.current);
      current.current = next;
      setUrl(next);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  return [url, take] as const;
}
