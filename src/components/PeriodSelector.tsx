import Link from "next/link";
import { UI_PERIODS } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";
import { MonthSelect } from "./MonthSelect";

type Props = {
  username: string;
  /** Período atual: um dos períodos do Last.fm ("7day"...) ou um mês ("2026-10"). */
  current: string;
  tab: Tab;
  /** Meses fechados oferecidos na caixa de seleção. */
  months: string[];
};

/** Links de período. Cada um leva para /u/USERNAME?tab=...&period=... (mantendo a aba). */
export function PeriodSelector({ username, current, tab, months }: Props) {
  return (
    <nav aria-label="Período" className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-2">
        {UI_PERIODS.map((p) => {
          const active = p.value === current;
          return (
            <li key={p.value}>
              <Link
                href={userPageHref(username, tab, p.value)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={
                  "inline-block rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 " +
                  (active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500")
                }
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <MonthSelect
        username={username}
        tab={tab}
        months={months}
        current={months.includes(current) ? current : undefined}
      />
    </nav>
  );
}
