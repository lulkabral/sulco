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
      className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60"
    >
      {pending ? "Tentando…" : "Tentar de novo"}
    </button>
  );
}
