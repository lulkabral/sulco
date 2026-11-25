"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, type MouseEvent } from "react";
import { useI18n } from "@/i18n/client";
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
  const { lang, t: dict } = useI18n();
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
    <nav aria-label={dict.profile.tabsLabel} className="flex-1 sm:flex-none">
      <ul className="relative grid grid-cols-3 rounded-full border border-line bg-card-2 p-1 sm:inline-grid sm:w-[22rem]">
        {/* Destaque que desliza para a aba escolhida. */}
        <li
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc((100%-0.5rem)/3)] rounded-full bg-cta shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {TABS.map((t) => {
          const active = t.value === shown;
          const href = userPageHref(username, t.value, period, lang);
          return (
            <li key={t.value} className="relative z-10">
              <Link
                href={href}
                onClick={(e) => go(e, t.value, href)}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={
                  "flex items-center justify-center gap-1.5 rounded-full px-1.5 py-2 text-[11px] font-bold whitespace-nowrap transition-colors duration-200 ease-smooth min-[400px]:text-xs sm:gap-2 sm:px-3.5 sm:text-sm " +
                  (active ? "text-cta-ink" : "text-soft hover:text-ink")
                }
              >
                {t.value === "recap" ? <StoryIcon /> : t.value === "grade" ? <GridIcon /> : <TopsIcon />}
                {dict.profile.tabs[t.value]}
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
  className: "hidden size-3.5 shrink-0 min-[420px]:block sm:size-4",
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

/** Três barras de ranking (cartões de tops). */
function TopsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5h16" />
      <rect x="5" y="10" width="3.5" height="6.5" rx="0.8" />
      <rect x="10.25" y="5" width="3.5" height="11.5" rx="0.8" />
      <rect x="15.5" y="12" width="3.5" height="4.5" rx="0.8" />
    </svg>
  );
}
