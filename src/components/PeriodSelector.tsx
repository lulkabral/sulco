import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { shortPeriodLabel } from "@/lib/period-label";
import { UI_PERIODS } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";
import { MonthYearPicker } from "./MonthYearPicker";
import { PeriodPicker } from "./PeriodPicker";

type Props = {
  username: string;
  /** Período atual: um dos períodos do Last.fm ("7day"...), um mês ("2026-10") ou um ano. */
  current: string;
  tab: Tab;
  /** Meses fechados desde o cadastro (do mais recente para o mais antigo). */
  months: string[];
  /** Anos desde o cadastro (o 1º é o corrente, "até agora"). */
  years: number[];
};

/**
 * Escolha de período ao lado das abas: um botão com o período atual ("30 dias ▾") que abre
 * a gaveta (celular) ou a janela (computador) com os períodos do Last.fm e o calendário
 * (MonthYearPicker). Tudo leva a /u/USERNAME?tab=...&period=...
 */
export async function PeriodSelector({ username, current, tab, months, years }: Props) {
  const { lang, t } = await getI18n();
  const label = shortPeriodLabel(current, years[0] ?? new Date().getFullYear(), lang);
  const pills = (
    <ul className="flex flex-wrap gap-2">
      {UI_PERIODS.map((p) => (
        <Pill
          key={p.value}
          href={userPageHref(username, tab, p.value, lang)}
          active={p.value === current}
          label={t.periods.short[p.value]}
          title={t.periods.long[p.value]}
        />
      ))}
    </ul>
  );

  return (
    <nav aria-label={t.profile.periodNav} className="ml-auto">
      <PeriodPicker label={label}>
        {pills}
        {years.length > 0 && (
          <MonthYearPicker username={username} tab={tab} current={current} months={months} years={years} />
        )}
      </PeriodPicker>
    </nav>
  );
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
            : "border border-line text-soft hover:border-ink-faint hover:text-ink")
        }
      >
        {label}
      </Link>
    </li>
  );
}
