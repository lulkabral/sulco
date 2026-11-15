import Link from "next/link";
import { TABS, userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  current: Tab;
  /** Período escolhido pela pessoa (do endereço), ou undefined se ela não escolheu. */
  period?: string;
};

/**
 * Abas Recap | Grade, como um seletor de dois lados. São links (como os períodos),
 * então a aba fica no endereço e dá para voltar ou compartilhar o link.
 */
export function ProfileTabs({ username, current, period }: Props) {
  return (
    <nav aria-label="Abas">
      <ul className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 sm:inline-grid sm:w-72">
        {TABS.map((t) => {
          const active = t.value === current;
          return (
            <li key={t.value}>
              <Link
                href={userPageHref(username, t.value, period)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={
                  "block rounded-xl px-4 py-2 text-center font-semibold transition " +
                  (active ? "bg-card-2 text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:text-ink")
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
