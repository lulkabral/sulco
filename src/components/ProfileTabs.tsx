"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type MouseEvent } from "react";
import { TABS, userPageHref, type Tab } from "@/lib/tabs";

type Props = {
  username: string;
  current: Tab;
  /** Período escolhido pela pessoa (do endereço), ou undefined se ela não escolheu. */
  period?: string;
};

/**
 * Abas Recap | Grade, como um seletor de dois lados com um destaque âmbar que desliza.
 * Continuam sendo links (a aba fica no endereço), mas o destaque muda na hora do toque,
 * sem esperar a página nova chegar do servidor.
 */
export function ProfileTabs({ username, current, period }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Mostra a aba tocada imediatamente; volta ao valor real se a navegação falhar.
  const [shown, setShown] = useOptimistic(current);
  const index = TABS.findIndex((t) => t.value === shown);

  function go(e: MouseEvent<HTMLAnchorElement>, tab: Tab, href: string) {
    // Ctrl/Cmd+clique (abrir em outra aba) segue o comportamento normal do link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (tab === shown) return;
    startTransition(() => {
      setShown(tab);
      router.push(href, { scroll: false });
    });
  }

  return (
    <nav aria-label="Abas">
      <ul className="relative grid grid-cols-2 rounded-2xl bg-card p-1 sm:inline-grid sm:w-72">
        {/* Destaque que desliza para a aba escolhida. */}
        <li
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-amber shadow-md shadow-black/30 transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {TABS.map((t) => {
          const active = t.value === shown;
          const href = userPageHref(username, t.value, period);
          return (
            <li key={t.value} className="relative">
              <Link
                href={href}
                onClick={(e) => go(e, t.value, href)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors duration-300 " +
                  (active ? "text-amber-ink" : "text-ink-soft hover:text-ink")
                }
              >
                {t.value === "recap" ? <StoryIcon /> : <GridIcon />}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-4 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Retângulo em pé, como um story. */
function StoryIcon() {
  return (
    <svg {...iconProps}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M9.5 7h5M9.5 16h5" />
    </svg>
  );
}

/** Grade 2x2 de capas. */
function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
