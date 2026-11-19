"use client";

import { useRef, type MouseEvent } from "react";
import { useI18n } from "@/i18n/client";
import { UsernameForm } from "./UsernameForm";

/**
 * Botão "↺ Trocar usuário" no topo da página do perfil: abre uma gaveta rápida com o
 * campo de username, para abrir outro perfil em um toque sem precisar voltar ao início.
 */
export function QuickUserSwitch() {
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
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition duration-200 ease-smooth hover:bg-card-2 active:scale-[0.98]"
      >
        <span aria-hidden>↺</span>
        <span className="hidden sm:inline">{t.profile.switchUser}</span>
        <span className="sm:hidden">{t.profile.switchUserShort}</span>
      </button>

      <dialog
        ref={dialog}
        onClick={onDialogClick}
        aria-labelledby="trocar-usuario-titulo"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[28px] border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/70 open:motion-safe:animate-sheet sm:m-auto sm:max-w-md sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 id="trocar-usuario-titulo" className="text-base font-extrabold tracking-tight text-ink">
            {t.profile.switchUserHeading}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-soft transition-colors duration-200 ease-smooth hover:text-ink"
          >
            {t.common.close} ✕
          </button>
        </div>
        <div className="p-5">
          <UsernameForm compact onSubmitted={() => dialog.current?.close()} />
        </div>
      </dialog>
    </>
  );
}
