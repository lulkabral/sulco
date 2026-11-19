"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { validateUsername } from "@/lib/lastfm/validate";

type Props = {
  defaultValue?: string;
};

/** Começo do endereço de um perfil no Last.fm, mostrado antes do campo (a partir de telas `sm`). */
const PROFILE_PREFIX = "last.fm/user/";

/**
 * Campo de username. Valida no navegador e leva para /u/USERNAME.
 * Visual de painel de aparelho (docs/MARCA.md): borda fina que acende no foco e botão sólido.
 */
export function UsernameForm({ defaultValue = "" }: Props) {
  const router = useRouter();
  const { t, href } = useI18n();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  // "Abrindo…" só enquanto a navegação acontece: o React desliga sozinho quando ela termina.
  // (Um estado comum ficava preso: o Next guarda a página inicial escondida e, ao voltar
  // para ela, o botão continuava em "Abrindo…".)
  const [sending, startSending] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateUsername(value);
    if (!result.ok) {
      setError(t.form.invalid);
      return;
    }
    setError(null);
    startSending(() => router.push(href(`/u/${encodeURIComponent(result.value)}`)));
  }

  return (
    // action="/u": sem JavaScript, o navegador envia para /u?username=..., que redireciona.
    <form action={href("/u")} method="get" onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2">
      <label htmlFor="username" className="font-mono text-xs font-medium tracking-[0.14em] text-ink-faint uppercase">
        {t.form.label}
      </label>
      <div className="flex items-stretch rounded-[3px] border border-line bg-card transition-colors focus-within:border-amber focus-within:ring-1 focus-within:ring-amber">
        <span aria-hidden className="hidden items-center pl-4 font-mono text-sm text-ink-faint select-none sm:flex">
          {PROFILE_PREFIX}
        </span>
        <input
          id="username"
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
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none sm:pl-0.5"
        />
        <button
          type="submit"
          disabled={sending}
          className="m-1 inline-flex shrink-0 items-center gap-2 rounded-[2px] bg-amber px-5 font-semibold text-amber-ink transition-colors hover:bg-amber-hover disabled:opacity-60"
        >
          {sending ? t.form.sending : t.form.submit}
          {!sending && <span aria-hidden>→</span>}
        </button>
      </div>
      {error && (
        <p id="username-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
