"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { validateUsername } from "@/lib/lastfm/validate";

type Props = {
  defaultValue?: string;
  /** Visual de "adesivo" (borda clara e sombra âmbar dura), usado na página inicial. */
  sticker?: boolean;
};

/** Campo de username. Valida no navegador e leva para /u/USERNAME. */
export function UsernameForm({ defaultValue = "", sticker = false }: Props) {
  const router = useRouter();
  const { t, href } = useI18n();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateUsername(value);
    if (!result.ok) {
      setError(t.form.invalid);
      return;
    }
    setError(null);
    setSending(true);
    router.push(href(`/u/${encodeURIComponent(result.value)}`));
  }

  return (
    // action="/u": sem JavaScript, o navegador envia para /u?username=..., que redireciona.
    <form action={href("/u")} method="get" onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2">
      <label htmlFor="username" className="text-sm font-semibold text-soft">
        {t.form.label}
      </label>
      <div
        className={
          sticker
            ? "flex overflow-hidden rounded-xl border-2 border-ink bg-card shadow-[4px_4px_0_var(--accent)] focus-within:shadow-[6px_6px_0_var(--accent)] transition-shadow"
            : "flex gap-1.5 rounded-2xl border border-line bg-card p-1.5 focus-within:border-amber focus-within:ring-1 focus-within:ring-amber"
        }
      >
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
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className={
            (sticker ? "px-5 py-3 font-extrabold " : "rounded-xl px-5 py-2 font-bold ") +
            "bg-amber text-amber-ink transition hover:bg-amber-hover active:scale-95 disabled:opacity-60"
          }
        >
          {sending ? t.form.sending : t.form.submit}
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
