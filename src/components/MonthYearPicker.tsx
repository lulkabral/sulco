"use client";

import Link from "next/link";
import { useState } from "react";
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

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * "Escolher mês ou ano": um calendário compacto. As setas ‹ › trocam o ano mostrado
 * (sem recarregar a página); os meses e o botão do ano inteiro são links.
 * Meses que ainda não terminaram, ou de antes do cadastro, aparecem apagados.
 */
export function MonthYearPicker({ username, tab, current, months, years }: Props) {
  // Ano mostrado ao abrir: o do período escolhido (mês ou ano) ou o mais recente.
  const initial = /^\d{4}/.test(current) && years.includes(Number(current.slice(0, 4)))
    ? Number(current.slice(0, 4))
    : years[0];
  const [year, setYear] = useState(initial);
  const index = years.indexOf(year);
  const isCurrentYear = index === 0;
  const available = new Set(months);

  const arrow =
    "flex size-9 items-center justify-center rounded-full text-xl text-ink-soft transition hover:bg-card-2 hover:text-ink disabled:pointer-events-none disabled:opacity-25";

  return (
    <section aria-labelledby="escolher-mes-ano" className="rounded-2xl bg-card p-4 sm:max-w-md">
      <h2 id="escolher-mes-ano" className="text-xs font-bold uppercase tracking-widest text-ink-soft">
        Escolher mês ou ano
      </h2>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className={arrow}
          onClick={() => setYear(years[index + 1])}
          disabled={index >= years.length - 1}
          aria-label="Ano anterior"
        >
          ‹
        </button>
        <p className="text-lg font-extrabold tabular-nums" aria-live="polite">
          {year}
        </p>
        <button
          type="button"
          className={arrow}
          onClick={() => setYear(years[index - 1])}
          disabled={index <= 0}
          aria-label="Próximo ano"
        >
          ›
        </button>
      </div>

      <ul className="mt-2 grid grid-cols-4 gap-2" aria-label={`Meses de ${year}`}>
        {MONTH_SHORT.map((name, i) => {
          const id = `${year}-${String(i + 1).padStart(2, "0")}`;
          const active = current === id;
          if (!available.has(id)) {
            return (
              <li key={id}>
                <span
                  aria-disabled
                  title="Mês ainda não terminou ou é de antes do cadastro"
                  className="block rounded-xl border border-line/50 py-2 text-center text-sm capitalize text-ink-faint/50"
                >
                  {name}
                </span>
              </li>
            );
          }
          return (
            <li key={id}>
              <Link
                href={userPageHref(username, tab, id)}
                aria-current={active ? "page" : undefined}
                title={monthLabel(id)}
                scroll={false}
                className={
                  "block rounded-xl border py-2 text-center text-sm capitalize transition active:scale-95 " +
                  (active
                    ? "border-amber bg-amber font-bold text-amber-ink"
                    : "border-line text-ink-soft hover:border-ink-faint hover:text-ink")
                }
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={userPageHref(username, tab, String(year))}
        aria-current={current === String(year) ? "page" : undefined}
        scroll={false}
        className={
          "mt-2 block rounded-xl border py-2 text-center text-sm font-semibold transition active:scale-95 " +
          (current === String(year)
            ? "border-amber bg-amber font-bold text-amber-ink"
            : "border-amber/60 text-ink hover:border-amber")
        }
      >
        {isCurrentYear ? `${year} até agora` : `Ano inteiro de ${year}`}
      </Link>
    </section>
  );
}
