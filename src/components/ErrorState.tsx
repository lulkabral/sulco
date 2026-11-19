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
    <div role="alert" className="flex flex-col items-start gap-4 rounded-[24px] border border-line bg-card p-6">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-soft">{text}</p>
      </div>
      {askUsername && <UsernameForm defaultValue={username} />}
      {canRetry &&
        (onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-cta px-5 py-2.5 text-sm font-bold text-cta-ink transition duration-200 ease-smooth hover:bg-cta-hover active:scale-[0.98]"
          >
            {t.errors.retry}
          </button>
        ) : (
          <RetryButton />
        ))}
    </div>
  );
}
