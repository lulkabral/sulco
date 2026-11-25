"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";

type Props = {
  href: string;
  /** Nome da lista para leitor de tela ("Artistas", "Músicas"...). */
  listName: string;
};

/**
 * Atalho discreto no cabeçalho de cada cartão de "O que mais tocou" para abrir a aba
 * Tops já selecionada naquela categoria.
 */
export function CardShortcut({ href, listName }: Props) {
  const { t } = useI18n();
  const label = t.lists.cardAria(listName);
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-stage-line bg-stage-card text-stage-soft transition duration-200 ease-smooth hover:border-amber/50 hover:text-amber active:scale-[0.95]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M7 12H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1" />
      </svg>
    </Link>
  );
}
