import Link from "next/link";
import { TABS, userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  current: Tab;
  /** Período escolhido pela pessoa (do endereço), ou undefined se ela não escolheu. */
  period?: string;
};

/**
 * Abas Recap | Grade. São links (como o seletor de período), então a aba fica no endereço
 * e dá para voltar ou compartilhar o link.
 */
export function ProfileTabs({ username, current, period }: Props) {
  return (
    <nav aria-label="Abas">
      <ul className="flex border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => {
          const active = t.value === current;
          return (
            <li key={t.value}>
              <Link
                href={userPageHref(username, t.value, period)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={
                  "-mb-px inline-block border-b-2 px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 " +
                  (active
                    ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
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
