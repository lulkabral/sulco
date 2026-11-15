import Link from "next/link";
import { monthPillLabel } from "@/lib/months";
import { UI_PERIODS } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  /** Período atual: um dos períodos do Last.fm ("7day"...) ou um mês ("2026-10"). */
  current: string;
  tab: Tab;
  /** Meses fechados oferecidos (do mais recente para o mais antigo). */
  months: string[];
};

/** Rótulos curtos para caber na fileira. */
const SHORT: Record<string, string> = {
  "7day": "7 dias",
  "1month": "30 dias",
  "3month": "3 meses",
  "6month": "6 meses",
  "12month": "12 meses",
};

/**
 * Uma fileira só com os períodos do Last.fm e os 12 meses fechados.
 * No celular ela rola para o lado. Cada item é um link (/u/USERNAME?tab=...&period=...).
 */
export function PeriodSelector({ username, current, tab, months }: Props) {
  const newestYear = Number(months[0]?.slice(0, 4));
  return (
    <nav aria-label="Período" className="-mx-4 sm:mx-0">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:px-0">
        {UI_PERIODS.map((p) => (
          <Pill
            key={p.value}
            href={userPageHref(username, tab, p.value)}
            active={p.value === current}
            label={SHORT[p.value]}
            title={p.label}
          />
        ))}
        <li aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-line" />
        {months.map((m) => (
          <Pill
            key={m}
            href={userPageHref(username, tab, m)}
            active={m === current}
            label={monthPillLabel(m, newestYear)}
          />
        ))}
      </ul>
    </nav>
  );
}

function Pill({ href, active, label, title }: { href: string; active: boolean; label: string; title?: string }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        title={title}
        scroll={false}
        className={
          "inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-95 " +
          (active
            ? "bg-amber font-bold text-amber-ink"
            : "border border-line text-ink-soft hover:border-ink-faint hover:text-ink")
        }
      >
        {label}
      </Link>
    </li>
  );
}
