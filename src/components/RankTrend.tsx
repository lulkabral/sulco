"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { hasAnyRankChange, type RankChange } from "@/lib/rank-change";

export type RankChangesInput =
  | Promise<(RankChange | null)[] | null>
  | (RankChange | null)[]
  | null
  | undefined;

function isPromise<T>(value: unknown): value is Promise<T> {
  return typeof value === "object" && value !== null && typeof (value as PromiseLike<T>).then === "function";
}

/**
 * Resolve uma lista de variações de ranking (síncrona ou vinda de Promise do servidor)
 * sem bloquear o primeiro desenho e sem `setState` síncrono no efeito.
 * `reserve`: indica se a coluna da seta deve reservar espaço fixo (evita pulo no layout).
 */
export function useResolvedRankChanges(input: RankChangesInput): {
  changes: (RankChange | null)[] | null;
  reserve: boolean;
} {
  const promise = isPromise<(RankChange | null)[] | null>(input) ? input : null;
  const [resolved, setResolved] = useState<{
    source: Promise<(RankChange | null)[] | null>;
    value: (RankChange | null)[] | null;
  } | null>(null);

  useEffect(() => {
    if (!promise) return;
    let alive = true;
    promise.then(
      (value) => {
        if (alive) setResolved({ source: promise, value });
      },
      () => {
        if (alive) setResolved({ source: promise, value: null });
      },
    );
    return () => {
      alive = false;
    };
  }, [promise]);

  if (Array.isArray(input)) {
    return { changes: input, reserve: hasAnyRankChange(input) };
  }
  if (!promise) {
    return { changes: null, reserve: false };
  }
  if (resolved && resolved.source === promise) {
    return { changes: resolved.value, reserve: hasAnyRankChange(resolved.value) };
  }
  // Ainda carregando do servidor: reserva o espaço para as capas não se mexerem depois.
  return { changes: null, reserve: true };
}

type Surface = "card" | "terra";

const GLYPH_COLOR: Record<Surface, Record<RankChange["status"], string>> = {
  card: {
    up: "text-trend-up",
    down: "text-trend-down",
    new: "text-trend-new",
    same: "text-ink-faint/45",
  },
  terra: {
    up: "text-trend-up-stage",
    down: "text-trend-down-stage",
    new: "text-trend-new-stage",
    same: "text-stage-faint/60",
  },
};

/** Símbolo vetorial limpo: ▲ verde (subiu), ▼ vermelho (caiu), ● azul (estreia), – neutro (igual). */
export function TrendGlyph({
  status,
  surface = "card",
}: {
  status: RankChange["status"];
  surface?: Surface;
}) {
  const color = GLYPH_COLOR[surface][status];
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 8"
      className={`h-2 w-2.5 shrink-0 ${color}`}
      fill="currentColor"
    >
      {status === "up" && <path d="M5 0.6L9.4 7.4H0.6L5 0.6Z" />}
      {status === "down" && <path d="M5 7.4L9.4 0.6H0.6L5 7.4Z" />}
      {status === "new" && <circle cx="5" cy="4" r="3.2" />}
      {status === "same" && <rect x="1.8" y="3.3" width="6.4" height="1.4" rx="0.7" />}
    </svg>
  );
}

/**
 * Indicador de movimento ao lado da posição (`01`, `02`...) com descrição acessível no
 * mouse (`title`) e para leitores de tela (`aria-label`).
 * No cartão terracota (`surface="terra"`), entra numa mini pílula escura para manter contraste AA.
 */
export function RankTrend({
  change,
  surface = "card",
}: {
  change: RankChange | null | undefined;
  surface?: Surface;
}) {
  const { t } = useI18n();
  if (!change) {
    return (
      <span
        aria-hidden
        className={surface === "terra" ? "inline-flex size-4 shrink-0" : "inline-flex w-2.5 shrink-0"}
      />
    );
  }

  const label =
    change.status === "up"
      ? t.lists.trend.up(change.delta, change.prevRank)
      : change.status === "down"
        ? t.lists.trend.down(change.delta, change.prevRank)
        : change.status === "same"
          ? t.lists.trend.same(change.prevRank)
          : t.lists.trend.firstTime;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={
        surface === "terra"
          ? "inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-stage/85 motion-safe:animate-disc-in"
          : "inline-flex w-2.5 shrink-0 items-center justify-center motion-safe:animate-disc-in"
      }
    >
      <TrendGlyph status={change.status} surface={surface} />
    </span>
  );
}

/**
 * Legenda discreta no topo de "O que mais tocou" indicando o período comparado e o significado
 * de cada símbolo (só aparece quando há dados do período anterior para comparar).
 */
export function TrendLegend({
  label,
  ready,
}: {
  label?: string;
  ready?: Promise<boolean> | boolean;
}) {
  const { t } = useI18n();
  const promise = isPromise<boolean>(ready) ? ready : null;
  const [resolved, setResolved] = useState<{ source: Promise<boolean>; value: boolean } | null>(null);

  useEffect(() => {
    if (!promise) return;
    let alive = true;
    promise.then(
      (value) => {
        if (alive) setResolved({ source: promise, value });
      },
      () => {
        if (alive) setResolved({ source: promise, value: false });
      },
    );
    return () => {
      alive = false;
    };
  }, [promise]);

  const show = Boolean(label) && (promise ? resolved?.source === promise && resolved.value : Boolean(ready));
  if (!show || !label) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-faint motion-safe:animate-disc-in">
      <span>{t.lists.trend.vs(label)}</span>
      <span className="inline-flex items-center gap-1">
        <TrendGlyph status="up" />
        {t.lists.trend.legendUp}
      </span>
      <span className="inline-flex items-center gap-1">
        <TrendGlyph status="down" />
        {t.lists.trend.legendDown}
      </span>
      <span className="inline-flex items-center gap-1">
        <TrendGlyph status="new" />
        {t.lists.trend.legendNew}
      </span>
    </p>
  );
}
