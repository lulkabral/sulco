"use client";

import { useI18n } from "@/i18n/client";
import type { ErrorCode } from "@/lib/lastfm/types";
import { RetryButton } from "./RetryButton";
import { UsernameForm } from "./UsernameForm";

type Props = {
  code: ErrorCode;
  username?: string;
  /** Ação de "Tentar de novo" feita no navegador (ex.: mês fechado). Sem ela, recarrega do servidor. */
  onRetry?: () => void;
};

/** Mensagem para cada um dos nossos códigos de erro. */
export function ErrorState({ code, username, onRetry }: Props) {
  const { t } = useI18n();
  const { title, text } = t.errors[code];
  const askUsername = code === "BAD_REQUEST" || code === "USER_NOT_FOUND";
  const canRetry = code === "RATE_LIMITED" || code === "LASTFM_DOWN";

  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-ink-soft">{text}</p>
      </div>
      {askUsername && <UsernameForm defaultValue={username} />}
      {canRetry &&
        (onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-amber px-4 py-2 font-bold text-amber-ink transition hover:bg-amber-hover active:scale-95"
          >
            {t.errors.retry}
          </button>
        ) : (
          <RetryButton />
        ))}
    </div>
  );
}
