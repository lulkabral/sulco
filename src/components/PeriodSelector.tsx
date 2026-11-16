import Link from "next/link";
import { UI_PERIODS } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";
import { MonthYearPicker } from "./MonthYearPicker";

type Props = {
  username: string;
  /** Período atual: um dos períodos do Last.fm ("7day"...) ou um mês ("2026-10"). */
  current: string;
  tab: Tab;
  /** Meses fechados desde o cadastro (do mais recente para o mais antigo). */
  months: string[];
  /** Anos desde o cadastro (o 1º é o corrente, "até agora"). */
  years: number[];
};

/** Rótulos curtos para caber na fileira. */
const SHORT: Record<string, string> = {
  overall: "Todo o tempo",
  "7day": "7 dias",
  "1month": "30 dias",
  "3month": "3 meses",
  "6month": "6 meses",
  "12month": "12 meses",
};

/**
 * Seletor de período em duas partes:
 * - fileira com "Todo o tempo" e os períodos do Last.fm (no celular, rola para o lado);
 * - "Escolher mês ou ano": calendário com ‹ ano › e a grade de meses (MonthYearPicker).
 * Tudo leva a /u/USERNAME?tab=...&period=...
 */
export function PeriodSelector({ username, current, tab, months, years }: Props) {
  return (
    <nav aria-label="Período" className="-mx-4 flex flex-col gap-3 sm:mx-0">
      <Row>
        {UI_PERIODS.map((p) => (
          <Pill
            key={p.value}
            href={userPageHref(username, tab, p.value)}
            active={p.value === current}
            label={SHORT[p.value]}
            title={p.label}
          />
        ))}
      </Row>
      {years.length > 0 && (
        <div className="px-4 sm:px-0">
          <MonthYearPicker username={username} tab={tab} current={current} months={months} years={years} />
        </div>
      )}
    </nav>
  );
}

/** Fileira de bolinhas: no celular rola para o lado; no computador quebra linha. */
function Row({ children }: { children: React.ReactNode }) {
  return <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-0.5 sm:flex-wrap sm:px-0">{children}</ul>;
}

type PillProps = {
  href: string;
  active: boolean;
  label: string;
  title?: string;
};

function Pill({ href, active, label, title }: PillProps) {
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
