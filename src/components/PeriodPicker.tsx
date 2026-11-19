"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";

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
  const { t } = useI18n();

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
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line-strong bg-card px-4 py-2.5 text-sm font-bold whitespace-nowrap text-ink shadow-sm transition duration-200 ease-smooth hover:bg-card-2 active:scale-[0.98]"
      >
        <span className="sr-only">{t.profile.periodButton}</span>
        {label}
        <span aria-hidden className="text-xs text-terra-text">
          ▾
        </span>
      </button>

      <dialog
        ref={dialog}
        onClick={onDialogClick}
        aria-label={t.profile.periodDialog}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[28px] border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/70 open:motion-safe:animate-sheet sm:m-auto sm:max-w-md sm:rounded-[28px]"
      >
        <div className="flex flex-col gap-4 p-5">
          <div aria-hidden className="mx-auto -mt-1 h-1 w-10 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <h2 className="font-mono text-xs font-semibold tracking-[0.14em] text-terra-text uppercase">
              {t.profile.periodHeading}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-soft transition-colors duration-200 ease-smooth hover:text-ink"
              aria-label={t.profile.close}
            >
              {t.profile.close} ✕
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
