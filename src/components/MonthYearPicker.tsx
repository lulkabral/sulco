"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { monthLabel } from "@/lib/months";
import { userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  tab: Tab;
  /** Período atual ("7day", "2026-10", "2025"...). */
  current: string;
  /** Meses fechados desde o cadastro ("AAAA-MM"). */
  months: string[];
  /** Anos desde o cadastro, do mais recente (o corrente) para o mais antigo. */
  years: number[];
};

/**
 * "Escolher mês ou ano": um calendário compacto. As setas ‹ › trocam o ano mostrado
 * (sem recarregar a página); os meses e o botão do ano inteiro são links.
 * Meses que ainda não terminaram, ou de antes do cadastro, aparecem apagados.
 */
export function MonthYearPicker({ username, tab, current, months, years }: Props) {
  const { lang, t } = useI18n();
  // Ano mostrado ao abrir: o do período escolhido (mês ou ano) ou o mais recente.
  const initial = /^\d{4}/.test(current) && years.includes(Number(current.slice(0, 4)))
    ? Number(current.slice(0, 4))
    : years[0];
  const [year, setYear] = useState(initial);
  const index = years.indexOf(year);
  const isCurrentYear = index === 0;
  const available = new Set(months);

  const arrow =
    "flex size-9 items-center justify-center rounded-full text-xl text-soft transition duration-200 ease-smooth hover:bg-card-2 hover:text-ink disabled:pointer-events-none disabled:opacity-25";

  return (
    <section aria-labelledby="escolher-mes-ano" className="border-t border-rule pt-4 sm:max-w-md">
      <div className="flex items-center justify-between">
        <h2 id="escolher-mes-ano" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-faint">
          {t.profile.pickerHeading}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={arrow}
            onClick={() => setYear(years[index + 1])}
            disabled={index >= years.length - 1}
            aria-label={t.profile.prevYear}
          >
            ‹
          </button>
          <p className="min-w-12 text-center text-base font-bold text-ink tabular-nums" aria-live="polite">
            {year}
          </p>
          <button
            type="button"
            className={arrow}
            onClick={() => setYear(years[index - 1])}
            disabled={index <= 0}
            aria-label={t.profile.nextYear}
          >
            ›
          </button>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-4 gap-2" aria-label={t.profile.monthsOf(year)}>
        {t.periods.monthsShort.map((name, i) => {
          const id = `${year}-${String(i + 1).padStart(2, "0")}`;
          const active = current === id;
          if (!available.has(id)) {
            return (
              <li key={id}>
                <span
                  aria-disabled
                  title={t.profile.monthUnavailable}
                  className="block rounded-xl border border-rule py-2 text-center text-sm capitalize text-ink-faint/45"
                >
                  {name}
                </span>
              </li>
            );
          }
          return (
            <li key={id}>
              <Link
                href={userPageHref(username, tab, id, lang)}
                aria-current={active ? "page" : undefined}
                title={monthLabel(id, lang)}
                scroll={false}
                className={
                  "block rounded-xl border py-2 text-center text-sm capitalize transition duration-200 ease-smooth active:scale-[0.98] " +
                  (active
                    ? "border-terra bg-terra font-bold text-terra-ink"
                    : "border-line text-soft hover:border-ink-faint hover:text-ink")
                }
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={userPageHref(username, tab, String(year), lang)}
        aria-current={current === String(year) ? "page" : undefined}
        scroll={false}
        className={
          "mt-2.5 block rounded-full border py-2.5 text-center text-sm font-semibold transition duration-200 ease-smooth active:scale-[0.98] " +
          (current === String(year)
            ? "border-terra bg-terra font-bold text-terra-ink"
            : "border-line text-ink hover:border-terra hover:text-terra-text")
        }
      >
        {isCurrentYear ? t.periods.yearOngoing(year) : t.periods.wholeYear(year)}
      </Link>
    </section>
  );
}
