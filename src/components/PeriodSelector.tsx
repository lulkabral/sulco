import Link from "next/link";
import { UI_PERIODS, type UiPeriod } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  current: UiPeriod;
  tab: Tab;
};

/** Links de período. Cada um leva para /u/USERNAME?tab=...&period=... (mantendo a aba). */
export function PeriodSelector({ username, current, tab }: Props) {
  return (
    <nav aria-label="Período">
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
    </nav>
  );
}
