"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/i18n/client";

/** Pede a página de novo ao servidor, sem recarregar tudo. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="rounded-full bg-cta px-5 py-2.5 text-sm font-bold text-cta-ink transition duration-200 ease-smooth hover:bg-cta-hover active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? t.errors.retrying : t.errors.retry}
    </button>
  );
}
