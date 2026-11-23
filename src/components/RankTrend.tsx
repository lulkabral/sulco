"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
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

type Surface = "card" | "terra" | "stage";

const GLYPH_COLOR: Record<Surface, Record<RankChange["status"], string>> = {
  card: {
    up: "text-trend-up",
    down: "text-trend-down",
    new: "text-trend-new",
    same: "text-ink-faint/45",
  },
  terra: {
    up: "text-trend-up-terra",
    down: "text-trend-down-terra",
    new: "text-trend-new-terra",
    same: "text-terra-ink/55",
  },
  stage: {
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
      className={`h-2.5 w-3 shrink-0 ${color}`}
      fill="currentColor"
    >
      {status === "up" && <path d="M5 0.6L9.4 7.4H0.6L5 0.6Z" />}
      {status === "down" && <path d="M5 7.4L9.4 0.6H0.6L5 7.4Z" />}
      {status === "new" && <circle cx="5" cy="4" r="3.2" />}
      {status === "same" && <rect x="1.8" y="3.3" width="6.4" height="1.4" rx="0.7" />}
    </svg>
  );
}

/** Posiciona o balão acima do gatilho quando o navegador ainda não suporta CSS Anchor Positioning. */
function positionFallback(trigger: HTMLElement, tip: HTMLElement) {
  const rect = trigger.getBoundingClientRect();
  const margin = 8;
  tip.dataset.anchored = "js";
  // Medição rápida fora de fluxo (o elemento já está visível no top layer após abrir ou via rAF).
  const tipWidth = tip.offsetWidth || 180;
  const tipHeight = tip.offsetHeight || 28;
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(margin, center - tipWidth / 2), window.innerWidth - tipWidth - margin);
  const above = rect.top - tipHeight - 6;
  const top = above >= margin ? above : Math.min(window.innerHeight - tipHeight - margin, rect.bottom + 6);
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

/**
 * Indicador interativo de movimento ao lado da posição (`01`, `02`...):
 * - No celular: tocar abre o balãozinho com o detalhe ("Subiu 14 posições (era #15)"),
 *   e tocar fora fecha sozinho (`popover="auto"` na camada superior, nunca cortado pelo cartão).
 * - No computador: passar o mouse, focar pelo teclado ou clicar abre o mesmo balãozinho;
 *   `Esc` fecha e o ponteiro pode descansar sobre o balão (WCAG 1.4.13).
 * - No cartão terracota (`surface="terra"`), usa símbolos soltos em tons luminosos (sem bolha).
 */
export function RankTrend({
  change,
  surface = "card",
}: {
  change: RankChange | null | undefined;
  surface?: Surface;
}) {
  const { t } = useI18n();
  const tipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const hoverOpenedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;

    const onToggle = (ev: Event) => {
      const isOpen = (ev as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (!isOpen) {
        hoverOpenedRef.current = false;
      } else if (buttonRef.current && !CSS.supports("position-area: block-start")) {
        positionFallback(buttonRef.current, tip);
      }
    };

    tip.addEventListener("toggle", onToggle);
    return () => {
      tip.removeEventListener("toggle", onToggle);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, [change]);

  if (!change) {
    return <span aria-hidden className="inline-flex w-2.5 shrink-0" />;
  }

  const label =
    change.status === "up"
      ? t.lists.trend.up(change.delta, change.prevRank)
      : change.status === "down"
        ? t.lists.trend.down(change.delta, change.prevRank)
        : change.status === "same"
          ? t.lists.trend.same(change.prevRank)
          : t.lists.trend.firstTime;

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openFromHover = () => {
    clearCloseTimer();
    const tip = tipRef.current;
    const btn = buttonRef.current;
    if (!tip || !btn || typeof tip.showPopover !== "function") return;
    if (tip.matches(":popover-open")) return;
    try {
      // Passa o gatilho como âncora implícita (suportado em navegadores modernos) com fallback seguro.
      (tip as HTMLElement & { showPopover: (opts?: { source?: HTMLElement }) => void }).showPopover({
        source: btn,
      });
    } catch {
      try {
        tip.showPopover();
      } catch {
        return;
      }
    }
    hoverOpenedRef.current = true;
  };

  const scheduleHoverClose = () => {
    if (!hoverOpenedRef.current) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      const tip = tipRef.current;
      if (hoverOpenedRef.current && tip && tip.matches(":popover-open")) {
        try {
          tip.hidePopover();
        } catch {
          // Ignora se já fechado.
        }
      }
    }, 120);
  };

  const anchorName = `--trend-${tipId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={tipId}
        popoverTargetAction="toggle"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        title={label}
        style={{ anchorName } as CSSProperties}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openFromHover();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") scheduleHoverClose();
        }}
        onClick={(e) => {
          // Se o mouse acabou de abrir via hover, clicar mantém aberto em vez de fechar.
          if (hoverOpenedRef.current && tipRef.current?.matches(":popover-open")) {
            e.preventDefault();
            hoverOpenedRef.current = false;
          }
        }}
        className={
          "-mx-1 inline-flex h-5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ease-smooth active:scale-90 motion-safe:animate-disc-in " +
          (surface === "terra" ? "hover:bg-white/15" : "hover:bg-card-2")
        }
      >
        <TrendGlyph status={change.status} surface={surface} />
      </button>
      <div
        ref={tipRef}
        id={tipId}
        popover="auto"
        role="tooltip"
        style={{ positionAnchor: anchorName } as CSSProperties}
        onPointerEnter={clearCloseTimer}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") scheduleHoverClose();
        }}
        className="trend-tip max-w-[calc(100vw-16px)] rounded-xl border border-stage-line bg-stage px-2.5 py-1.5 font-sans text-xs font-semibold leading-snug text-stage-ink shadow-lg shadow-black/30"
      >
        <span className="inline-flex items-center gap-1.5">
          <TrendGlyph status={change.status} surface="stage" />
          <span>{label}</span>
        </span>
      </div>
    </>
  );
}
