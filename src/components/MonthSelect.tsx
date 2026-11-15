"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { monthLabel } from "@/lib/months";
import { userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  tab: Tab;
  months: string[];
  /** Mês escolhido agora, ou undefined se o período atual não é um mês. */
  current?: string;
};

/** Caixa "Mês fechado": ao escolher, vai para /u/USERNAME?period=AAAA-MM (mantendo a aba). */
export function MonthSelect({ username, tab, months, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">Mês fechado:</span>
      <select
        value={current ?? ""}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value;
          if (value) startTransition(() => router.push(userPageHref(username, tab, value), { scroll: false }));
        }}
        className={
          "rounded-full border px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-zinc-950 " +
          (current
            ? "border-indigo-600 bg-indigo-600 text-white dark:bg-indigo-600"
            : "border-zinc-300 bg-white dark:border-zinc-700")
        }
      >
        <option value="" disabled>
          Escolha um mês
        </option>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
