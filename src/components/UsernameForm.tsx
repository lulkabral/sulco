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
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-2">
      <label htmlFor="username" className="text-sm font-medium">
        Username do Last.fm
      </label>
      <div className="flex gap-2">
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ex.: seu_usuario"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "username-error" : undefined}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60"
        >
          {sending ? "Abrindo…" : "Gerar"}
        </button>
      </div>
      {error && (
        <p id="username-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
