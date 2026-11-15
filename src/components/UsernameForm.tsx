"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { validateUsername } from "@/lib/lastfm/validate";

type Props = {
  defaultValue?: string;
};

/** Campo de username. Valida no navegador e leva para /u/USERNAME. */
export function UsernameForm({ defaultValue = "" }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateUsername(value);
    if (!result.ok) {
      setError("Digite um username do Last.fm válido (2 a 15 letras, números, _ ou -).");
      return;
    }
    setError(null);
    setSending(true);
    router.push(`/u/${encodeURIComponent(result.value)}`);
  }

  return (
    // action="/u": sem JavaScript, o navegador envia para /u?username=..., que redireciona.
    <form action="/u" method="get" onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2">
      <label htmlFor="username" className="text-sm font-semibold text-ink-soft">
        Username do Last.fm
      </label>
      <div className="flex gap-1.5 rounded-2xl border border-line bg-card p-1.5 focus-within:border-amber focus-within:ring-1 focus-within:ring-amber">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="seu_usuario"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "username-error" : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-amber px-5 py-2 font-bold text-amber-ink transition hover:bg-amber-hover active:scale-95 disabled:opacity-60"
        >
          {sending ? "Abrindo…" : "Gerar"}
        </button>
      </div>
      {error && (
        <p id="username-error" role="alert" className="text-sm text-[#ff9b85]">
          {error}
        </p>
      )}
    </form>
  );
}
