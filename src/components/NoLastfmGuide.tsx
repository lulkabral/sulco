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
        className="inline-flex items-baseline gap-2 text-sm text-soft transition-colors hover:text-ink"
      >
        {t.home.noLastfm}
        <span className="font-mono text-xs tracking-[0.14em] text-ink uppercase underline decoration-line underline-offset-4">
          {t.home.guideCta}
        </span>
      </button>

      <dialog
        ref={dialog}
        onClick={onDialogClick}
        aria-labelledby="guia-titulo"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none border-t border-line bg-card p-0 text-ink backdrop:bg-black/70 open:motion-safe:animate-sheet sm:m-auto sm:max-w-lg sm:border"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <h2 id="guia-titulo" className="font-mono text-xs font-medium tracking-[0.16em] text-soft uppercase">
            {t.home.guideTitle}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="px-2 py-1 font-mono text-xs tracking-[0.14em] text-soft uppercase hover:text-ink"
          >
            {t.common.close} ✕
          </button>
        </div>
        <ol className="divide-y divide-rule px-5 text-sm leading-relaxed text-soft">
          <li className="grid grid-cols-[2rem_1fr] py-4">
            <span className="font-mono text-ink-faint tabular-nums">01</span>
            <span>
              {t.home.noLastfmJoin}{" "}
              <a
                href="https://www.last.fm/join"
                className="text-ink underline decoration-amber underline-offset-4"
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
              <span className="font-mono text-ink-faint tabular-nums">{String(i + 2).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="border-t border-rule px-5 py-4 font-mono text-xs leading-relaxed text-ink-faint">{t.home.noLastfmNote}</p>
      </dialog>
    </>
  );
}
