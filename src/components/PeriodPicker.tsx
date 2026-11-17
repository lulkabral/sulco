"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  /** Rótulo do período escolhido ("30 dias", "out 2026"...). */
  label: ReactNode;
  /** Conteúdo da gaveta: os períodos e o calendário. */
  children: ReactNode;
};

/**
 * Botão "30 dias ▾" que abre a escolha de período: no celular, uma gaveta que sobe de baixo;
 * no computador, uma janela no meio. Usa o <dialog> do navegador, que já prende o foco,
 * fecha com Esc e devolve o foco ao botão. Fecha também ao tocar fora ou ao escolher.
 */
export function PeriodPicker({ label, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  function onDialogClick(e: MouseEvent<HTMLDialogElement>) {
    // Toque no fundo escuro (fora do painel) ou num link de período: fecha.
    const target = e.target as HTMLElement;
    if (target === dialog.current || target.closest("a")) dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink bg-card px-3.5 py-2 font-bold whitespace-nowrap shadow-[3px_3px_0_var(--color-amber)] transition hover:shadow-[4px_4px_0_var(--color-amber)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-amber)]"
      >
        <span className="sr-only">Período: </span>
        {label}
        <span aria-hidden className="text-xs text-amber">
          ▾
        </span>
      </button>

      <dialog
        ref={dialog}
        onClick={onDialogClick}
        aria-label="Escolher período"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-card p-0 text-ink backdrop:bg-black/60 open:motion-safe:animate-sheet sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex flex-col gap-4 p-5">
          <div aria-hidden className="mx-auto -mt-2 h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest text-ink-soft uppercase">Período</h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-full px-2 py-1 text-ink-soft hover:text-ink"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
