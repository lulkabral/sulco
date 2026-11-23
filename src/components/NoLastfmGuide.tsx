"use client";

import { useRef, type MouseEvent } from "react";
import { useI18n } from "@/i18n/client";

/**
 * "Não tem Last.fm? guia": abre uma gaveta (no celular, sobe de baixo; no computador, janela
 * no meio) com o passo a passo para começar. Usa o <dialog> do navegador, que prende o foco,
 * fecha com Esc e devolve o foco ao botão. Fecha também no botão e ao tocar fora.
 */
export function NoLastfmGuide() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  function onDialogClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialog.current) dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="inline-flex items-baseline gap-1.5 text-xs text-soft transition-colors duration-200 ease-smooth hover:text-ink sm:text-sm"
      >
        <span>{t.home.noLastfm}</span>
        <span className="font-semibold text-ink underline decoration-terra underline-offset-4">
          {t.home.guideCta}
        </span>
      </button>

      <dialog
        ref={dialog}
        onClick={onDialogClick}
        aria-labelledby="guia-titulo"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[28px] border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/70 open:motion-safe:animate-sheet sm:m-auto sm:max-w-lg sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <h2 id="guia-titulo" className="text-base font-extrabold tracking-tight text-ink">
            {t.home.guideTitle}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-soft transition-colors duration-200 ease-smooth hover:text-ink"
          >
            {t.common.close} ✕
          </button>
        </div>
        <ol className="divide-y divide-rule px-6 text-sm leading-relaxed text-soft">
          <li className="grid grid-cols-[2rem_1fr] py-4">
            <span className="font-bold text-terra-text tabular-nums">01</span>
            <span>
              {t.home.noLastfmJoin}{" "}
              <a
                href="https://www.last.fm/join"
                className="font-semibold text-ink underline decoration-terra underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                last.fm/join
              </a>
              {t.home.noLastfmJoinAfter}
            </span>
          </li>
          {t.home.noLastfmSteps.map((step, i) => (
            <li key={step} className="grid grid-cols-[2rem_1fr] py-4">
              <span className="font-bold text-terra-text tabular-nums">{String(i + 2).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="border-t border-rule px-6 py-4 text-xs leading-relaxed text-ink-faint">{t.home.noLastfmNote}</p>
      </dialog>
    </>
  );
}
