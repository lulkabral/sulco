"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { validateUsername } from "@/lib/lastfm/validate";

type Props = {
  defaultValue?: string;
  /** Esconde o rótulo acima do campo quando o título do modal/hero já explica o que digitar. */
  compact?: boolean;
  /** Chamado logo após disparar a navegação (ex.: fechar a gaveta de trocar usuário). */
  onSubmitted?: () => void;
};

/**
 * Campo de username. Valida no navegador e leva para /u/USERNAME.
 * Visual tátil em pílula arredondada, legível nos modos claro e escuro.
 */
export function UsernameForm({ defaultValue = "", compact = false, onSubmitted }: Props) {
  const router = useRouter();
  const { t, href } = useI18n();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  // "Abrindo…" só enquanto a navegação acontece: o React desliga sozinho quando ela termina.
  const [sending, startSending] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateUsername(value);
    if (!result.ok) {
      setError(t.form.invalid);
      return;
    }
    setError(null);
    onSubmitted?.();
    startSending(() => router.push(href(`/u/${encodeURIComponent(result.value)}`)));
  }

  return (
    // action="/u": sem JavaScript, o navegador envia para /u?username=..., que redireciona.
    <form action={href("/u")} method="get" onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2">
      <label
        htmlFor={compact ? "username-quick" : "username"}
        className={compact ? "sr-only" : "sr-only"}
      >
        {t.form.label}
      </label>
      <div className="flex items-center rounded-full border border-line-strong bg-card p-1.5 pl-4 shadow-sm transition-colors duration-200 ease-smooth focus-within:border-terra focus-within:ring-2 focus-within:ring-terra/25">
        <input
          id={compact ? "username-quick" : "username"}
          name="username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t.form.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "username-error" : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 pr-2 text-base text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-cta px-4 py-2.5 text-sm font-bold text-cta-ink transition duration-200 ease-smooth hover:bg-cta-hover active:scale-[0.98] disabled:opacity-60 sm:px-5"
        >
          <span>{sending ? t.form.sending : t.form.submit}</span>
          {!sending && (
            <span
              aria-hidden
              className="inline-flex size-5 items-center justify-center rounded-full bg-cta-badge text-xs text-cta-badge-ink transition-transform duration-200 ease-smooth group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              ↗
            </span>
          )}
        </button>
      </div>
      {error && (
        <p id="username-error" role="alert" className="px-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
