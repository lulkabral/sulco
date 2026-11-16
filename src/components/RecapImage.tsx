"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ExportButtons } from "@/components/ExportButtons";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { useCanvasSnapshot } from "@/lib/canvas/use-snapshot";
import { trackInfo } from "@/lib/lookups";
import { estimateMinutes } from "@/lib/minutes";
import { formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import { coverUrl } from "@/lib/grid/layout";
import { albumHeading, dateText, shortTag } from "@/lib/recap/copy";
import { paletteFromCover } from "@/lib/recap/cover-color";
import {
  drawRecap,
  RECAP_HEIGHT,
  RECAP_LAYOUTS,
  RECAP_WIDTH,
  type RecapListItem,
} from "@/lib/recap/draw";
import { COVER_PALETTE_ID, PALETTES, paletteById, type Palette } from "@/lib/recap/palettes";
import { parsePrefs, readPrefsRaw, savePrefs, subscribePrefs, type RecapPrefs } from "@/lib/recap/prefs";

type Props = {
  username: string;
  /** Período do Last.fm ("7day", "overall"...) ou mês "AAAA-MM". */
  period: string;
  periodLabel: string;
  /** Intervalo do período (timestamps UNIX em segundos), para mostrar as datas. */
  from: number;
  to: number;
  total: number;
  /** Gêneros calculados no servidor; chegam depois do resto (null = não deu para calcular). */
  genres: Promise<Genre[] | null>;
  /** Até 15 artistas (o Lineup usa todos). */
  artists: RecapListItem[];
  tracks: RecapListItem[];
  /** Até 9 álbuns (o Mosaico usa todas as capas). */
  albums: (RecapListItem & { imageUrl: string | null })[];
  /** Músicas mais ouvidas (até 10), para estimar os minutos pela duração delas. */
  minuteSample: { name: string; artist: string; playcount: number }[];
};

/** O que precisa estar carregado antes de desenhar. */
type Assets = {
  font: string;
  covers: (HTMLImageElement | null)[];
  genres: string[] | null;
  /** Paleta tirada da capa nº 1 (null se não der). */
  coverPalette: Palette | null;
};

/**
 * Aba Recap: imagem story (1080 x 1920) desenhada no canvas, com escolha de formato,
 * cor e números, e baixar/compartilhar. As escolhas ficam guardadas só neste navegador.
 */
export function RecapImage(props: Props) {
  const { username, period, periodLabel, from, to, total, genres, artists, tracks, albums, minuteSample } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  const [assets, setAssets] = useState<Assets | null>(null);

  // Escolhas guardadas no navegador. No servidor (e no 1º desenho) valem as padrão.
  const prefsRaw = useSyncExternalStore(subscribePrefs, readPrefsRaw, () => null);
  const prefs = useMemo(() => parsePrefs(prefsRaw), [prefsRaw]);
  // Parte sempre do que está salvo agora (e não da cópia desta renderização):
  // assim dois cliques rápidos não desfazem um ao outro.
  const choose = (patch: Partial<RecapPrefs>) => savePrefs({ ...parsePrefs(readPrefsRaw()), ...patch });

  // Minutos estimados: só calcula quando a pessoa liga "mostrar scrobbles" (poupa pedidos).
  const [minutes, setMinutes] = useState<{ key: string; value: number } | null>(null);
  const minutesKey = `${period}-${total}`;
  useEffect(() => {
    if (!prefs.showNumbers || minutes?.key === minutesKey) return;
    let alive = true;
    Promise.all(minuteSample.map((t) => trackInfo(t.artist, t.name))).then((infos) => {
      if (!alive) return;
      const value = estimateMinutes(
        total,
        infos.map((info, i) => ({ plays: minuteSample[i].playcount, durationSec: info.durationSec })),
      );
      setMinutes({ key: minutesKey, value });
    });
    return () => {
      alive = false;
    };
  }, [prefs.showNumbers, minutesKey, minutes?.key, minuteSample, total]);
  const minutesValue = minutes?.key === minutesKey ? minutes.value : null;

  const palette =
    prefs.paletteId === COVER_PALETTE_ID ? (assets?.coverPalette ?? PALETTES[0]) : paletteById(prefs.paletteId);

  // 1) Carrega fontes, capas e gêneros uma vez (trocar formato ou cor não baixa de novo).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const font = pageFontFamily();
      await waitForFonts(font);
      const [genreList, ...covers] = await Promise.all([
        genres,
        // Todas em 600 px: alguns formatos desenham capas além da nº 1 em mais de 500 px
        // (Mosaico, Toca-discos), e a imagem baixada precisa ficar nítida.
        ...albums.slice(0, 9).map((a) => (a.imageUrl ? loadImage(coverUrl(a.imageUrl, 600)) : null)),
      ]);
      if (cancelled) return;
      setAssets({
        font,
        covers: covers as (HTMLImageElement | null)[],
        genres: genreList ? (genreList as Genre[]).map((g) => g.name) : null,
        coverPalette: covers[0] ? paletteFromCover(covers[0] as HTMLImageElement) : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [albums, genres]);

  // 2) Desenha sempre que os dados ou as escolhas mudam (é instantâneo).
  useEffect(() => {
    if (!assets || !canvasRef.current) return;
    drawRecap(
      canvasRef.current,
      {
        username,
        title: periodLabel,
        // Datas no fuso do aparelho de quem gera a imagem.
        dateText: dateText(period, from, to),
        shortTag: shortTag(period),
        total,
        minutes: minutesValue,
        albumHeading: albumHeading(period),
        artists,
        tracks,
        albums,
        covers: assets.covers,
        genres: assets.genres,
        siteHost: window.location.host,
      },
      { layout: prefs.layout, palette, showNumbers: prefs.showNumbers, font: assets.font },
    );
    void takeSnapshot(canvasRef.current);
  }, [assets, prefs, palette, username, period, periodLabel, from, to, total, minutesValue, artists, tracks, albums, takeSnapshot]);

  const drawn = assets !== null;
  const coverAccent = assets?.coverPalette?.accent;

  return (
    <section
      aria-labelledby="recap-titulo"
      className="flex flex-col gap-4 motion-safe:animate-rise md:flex-row md:items-start md:gap-6"
    >
      <h2 id="recap-titulo" className="sr-only">
        Imagem do recap
      </h2>

      <div className="relative w-full max-w-xs self-center transition-transform duration-300 hover:-translate-y-1 md:self-start">
        <canvas
          ref={canvasRef}
          width={RECAP_WIDTH}
          height={RECAP_HEIGHT}
          aria-hidden
          className="block aspect-[9/16] w-full rounded-2xl bg-card shadow-2xl shadow-black/50 ring-1 ring-line"
        />
        {snapshot && (
          // Cópia em PNG por cima do canvas: no celular, segurar o dedo abre "Salvar imagem".
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snapshot}
            alt={`Recap de ${username}: ${periodLabel.toLowerCase()}, formato ${
              RECAP_LAYOUTS.find((l) => l.id === prefs.layout)?.name
            }. Os tops em texto estão abaixo.`}
            className="absolute left-0 top-0 aspect-[9/16] w-full rounded-2xl"
          />
        )}
        {!drawn && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center rounded-2xl text-sm font-semibold text-ink-soft"
          >
            Montando o recap…
          </p>
        )}
        {drawn && <SaveHint />}
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 md:min-w-80">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-ink-soft">{periodLabel}</p>
          <p className="mt-1 text-ink-soft">
            <span className="font-bold text-ink">{formatNumber(total)}</span> scrobbles
            {minutesValue !== null && (
              <>
                {" · "}
                <span className="font-bold text-ink">{formatNumber(minutesValue)}</span> minutos
                <span className="block text-xs text-ink-faint">
                  Minutos estimados pela duração das suas músicas mais ouvidas.
                </span>
              </>
            )}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">Formato</legend>
          <div className="grid grid-cols-2 gap-2">
            {RECAP_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={prefs.layout === l.id}
                onClick={() => choose({ layout: l.id })}
                className={
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-95 " +
                  (prefs.layout === l.id
                    ? "border-amber bg-amber text-amber-ink"
                    : "border-line text-ink-soft hover:text-ink")
                }
              >
                {l.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => (
              <Swatch
                key={p.id}
                label={p.name}
                active={prefs.paletteId === p.id}
                onClick={() => choose({ paletteId: p.id })}
                background={`linear-gradient(135deg, ${p.room} 50%, ${p.accent} 50%)`}
              />
            ))}
            <Swatch
              label="Cor da capa"
              active={prefs.paletteId === COVER_PALETTE_ID}
              onClick={() => choose({ paletteId: COVER_PALETTE_ID })}
              background={
                coverAccent
                  ? `linear-gradient(135deg, ${assets?.coverPalette?.room} 50%, ${coverAccent} 50%)`
                  : "conic-gradient(#e8a13a, #ff7aa2, #c59bff, #6fc3ff, #e8a13a)"
              }
            />
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:border-ink-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/5">
          <span>
            <span className="block font-semibold">Mostrar scrobbles e minutos</span>
            <span className="block text-sm text-ink-soft">
              Na imagem: total de scrobbles, minutos ouvidos e quantas vezes você ouviu cada item
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={prefs.showNumbers}
            onChange={(e) => choose({ showNumbers: e.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-ink after:transition peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
          />
        </label>

        <ExportButtons
          canvasRef={canvasRef}
          filename={`recap-${username}-${period}-${prefs.layout}.png`}
          shareTitle={`Meu recap: ${periodLabel.toLowerCase()}`}
          disabled={!drawn}
        />
      </div>
    </section>
  );
}

function Swatch({
  label,
  active,
  onClick,
  background,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  background: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={
        "size-10 rounded-full ring-offset-2 ring-offset-card transition active:scale-90 " +
        (active ? "ring-2 ring-amber" : "ring-1 ring-line hover:ring-ink-faint")
      }
      style={{ background }}
    />
  );
}

/** Dica de salvar segurando a imagem (só em telas de toque, onde isso funciona). */
export function SaveHint() {
  return (
    <p className="mt-2 hidden text-center text-xs text-ink-faint [@media(pointer:coarse)]:block">
      Dica: segure a imagem para salvar ou compartilhar.
    </p>
  );
}
