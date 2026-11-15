"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Pede a página de novo ao servidor, sem recarregar tudo. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="rounded-xl bg-amber px-4 py-2 font-bold text-amber-ink transition hover:bg-amber-hover active:scale-95 disabled:opacity-60"
    >
      {pending ? "Tentando…" : "Tentar de novo"}
    </button>
  );
}
