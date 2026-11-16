import Link from "next/link";
import { groupByYear, monthLabel } from "@/lib/months";
import { UI_PERIODS } from "@/lib/periods";
import { userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  /** Período atual: um dos períodos do Last.fm ("7day"...) ou um mês ("2026-10"). */
  current: string;
  tab: Tab;
  /** Meses fechados desde o cadastro (do mais recente para o mais antigo). */
  months: string[];
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

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Seletor de período em duas partes:
 * - fileira com "Todo o tempo" e os períodos do Last.fm;
 * - máquina do tempo: os anos desde o cadastro e, embaixo, os meses do ano escolhido.
 * Tudo são links (/u/USERNAME?tab=...&period=...). No celular as fileiras rolam para o lado.
 */
export function PeriodSelector({ username, current, tab, months }: Props) {
  const years = groupByYear(months);
  const currentYear = months.includes(current) ? Number(current.slice(0, 4)) : years[0]?.year;
  const yearMonths = years.find((y) => y.year === currentYear)?.months ?? [];

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
        <div className="flex flex-col gap-2 rounded-2xl bg-card py-3 sm:px-3">
          <p className="px-4 text-xs font-bold uppercase tracking-widest text-ink-soft sm:px-1">
            Máquina do tempo
          </p>
          <Row label="Ano" wrap>
            {years.map((y) => (
              <Pill
                key={y.year}
                // Clicar no ano abre o mês mais recente dele.
                href={userPageHref(username, tab, y.months.at(-1)!)}
                active={y.year === currentYear && months.includes(current)}
                outlined={y.year === currentYear}
                label={String(y.year)}
              />
            ))}
          </Row>
          <Row label="Mês" wrap>
            {yearMonths.map((m) => (
              <Pill
                key={m}
                href={userPageHref(username, tab, m)}
                active={m === current}
                label={MONTH_SHORT[Number(m.slice(5, 7)) - 1]}
                title={monthLabel(m)}
                small
              />
            ))}
          </Row>
        </div>
      )}
    </nav>
  );
}

/**
 * Fileira de bolinhas. Sem `wrap`, no celular ela rola para o lado; com `wrap`
 * (anos e meses da máquina do tempo), quebra linha para o item escolhido nunca ficar escondido.
 */
function Row({ children, label, wrap }: { children: React.ReactNode; label?: string; wrap?: boolean }) {
  return (
    <ul
      aria-label={label}
      className={
        "flex gap-2 px-4 pb-0.5 sm:flex-wrap sm:px-0 " + (wrap ? "flex-wrap" : "no-scrollbar overflow-x-auto")
      }
    >
      {children}
    </ul>
  );
}

type PillProps = {
  href: string;
  active: boolean;
  label: string;
  title?: string;
  /** Ano escolhido mas com outro período ativo: só contorno. */
  outlined?: boolean;
  small?: boolean;
};

function Pill({ href, active, label, title, outlined, small }: PillProps) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        title={title}
        scroll={false}
        className={
          "inline-block whitespace-nowrap rounded-full font-medium transition active:scale-95 " +
          (small ? "px-3 py-1 text-sm capitalize " : "px-3.5 py-1.5 text-sm ") +
          (active
            ? "bg-amber font-bold text-amber-ink"
            : outlined
              ? "border border-amber text-ink"
              : "border border-line text-ink-soft hover:border-ink-faint hover:text-ink")
        }
      >
        {label}
      </Link>
    </li>
  );
}
