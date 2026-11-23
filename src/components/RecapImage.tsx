"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useReportCoverPalette } from "@/components/AccentScope";
import { ExportButtons } from "@/components/ExportButtons";
import { Swatch } from "@/components/Swatch";
import { VinylLoader } from "@/components/VinylLoader";
import { useI18n } from "@/i18n/client";
import { loadImage, pageFontFamily, waitForFonts } from "@/lib/canvas/image";
import { useCanvasSnapshot } from "@/lib/canvas/use-snapshot";
import { albumCover, trackInfo } from "@/lib/lookups";
import { estimateMinutes } from "@/lib/minutes";
import { formatNumber } from "@/lib/format";
import type { Genre } from "@/lib/genres";
import { coverUrl, recapCoverPx } from "@/lib/grid/layout";
import { albumHeading, dateText, shortTag } from "@/lib/recap/copy";
import { paletteFromCover } from "@/lib/recap/cover-color";
import {
  drawRecap,
  RECAP_HEIGHT,
  RECAP_LAYOUTS,
  RECAP_WIDTH,
  type RecapLayoutId,
  type RecapListItem,
} from "@/lib/recap/draw";
import { COVER_PALETTE_ID, PALETTES, paletteById, type Palette } from "@/lib/recap/palettes";
import { parsePrefs, readPrefsRaw, savePrefs, subscribePrefs, type RecapPrefs } from "@/lib/recap/prefs";
import { pickVinylFinish, sampleCoverRgb } from "@/lib/vinyl-color";

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

/** Capas que entram na imagem (o Mosaico usa todas). */
const RECAP_COVERS = 9;

/**
 * Aba Recap: imagem story (1080 x 1920) desenhada no canvas, com escolha de formato,
 * cor e números, e baixar/compartilhar. As escolhas ficam guardadas só neste navegador.
 *
 * Desenha assim que a fonte está pronta e vai completando: cada capa entra quando chega,
 * e os gêneros (que podem levar alguns segundos) entram por último. Os botões de baixar
 * e compartilhar só liberam com a imagem completa.
 */
export function RecapImage(props: Props) {
  const { username, period, periodLabel, from, to, total, genres, artists, tracks, albums, minuteSample } = props;
  const { lang, t } = useI18n();
  const canvas0Ref = useRef<HTMLCanvasElement>(null);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  // Dois slots alternados de canvas: ao trocar de formato, o anterior some em fade suave
  // enquanto o novo entra por cima, sem corte seco.
  const [slot, setSlot] = useState<0 | 1>(0);
  const [snapshot, takeSnapshot] = useCanvasSnapshot();
  const [font, setFont] = useState<string | null>(null);
  const [covers, setCovers] = useState<(HTMLImageElement | null)[]>(() =>
    albums.slice(0, RECAP_COVERS).map(() => null),
  );
  const [coversDone, setCoversDone] = useState(false);
  /** undefined = ainda calculando; null = não deu para calcular. */
  const [genreNames, setGenreNames] = useState<string[] | null | undefined>(undefined);
  /** Paleta tirada da capa nº 1 (null se não der). */
  const [coverPalette, setCoverPalette] = useState<Palette | null>(null);
  // Avisa a página: com "Cor da capa", o destaque da interface usa esta paleta.
  const reportCoverPalette = useReportCoverPalette();
  useEffect(() => reportCoverPalette(coverPalette), [coverPalette, reportCoverPalette]);

  // Escolhas guardadas no navegador. No servidor (e no 1º desenho) valem as padrão.
  const prefsRaw = useSyncExternalStore(subscribePrefs, readPrefsRaw, () => null);
  const prefs = useMemo(() => parsePrefs(prefsRaw), [prefsRaw]);
  // Parte sempre do que está salvo agora (e não da cópia desta renderização):
  // assim dois cliques rápidos não desfazem um ao outro.
  const choose = (patch: Partial<RecapPrefs>) => savePrefs({ ...parsePrefs(readPrefsRaw()), ...patch });
  const selectLayout = (layout: RecapLayoutId) => {
    if (layout === prefs.layout) return;
    setSlot((s) => (s === 0 ? 1 : 0));
    choose({ layout });
  };

  // Minutos estimados: só calcula quando a pessoa liga "mostrar scrobbles" (poupa pedidos).
  const [minutes, setMinutes] = useState<{ key: string; value: number } | null>(null);
  const minutesKey = `${period}-${total}`;
  useEffect(() => {
    if (!prefs.showNumbers || minutes?.key === minutesKey) return;
    let alive = true;
    Promise.all(minuteSample.map((t) => trackInfo(t.artist, t.name, "high"))).then((infos) => {
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
    prefs.paletteId === COVER_PALETTE_ID ? (coverPalette ?? PALETTES[0]) : paletteById(prefs.paletteId);

  // Cor contrastante do vinil colorido (só usada quando a pessoa liga a opção no formato Toca-discos).
  const leadCover = covers[0] ?? null;
  const leadSeed = `${albums[0]?.artist ?? ""}-${albums[0]?.name ?? ""}`;
  const vinylColor = useMemo(() => {
    if (!leadCover) return null;
    const rgb = sampleCoverRgb(leadCover);
    return rgb ? pickVinylFinish(rgb, leadSeed).base : null;
  }, [leadCover, leadSeed]);

  // 1) Fonte: o único item que segura o 1º desenho (sem ela, o texto sairia na fonte reserva).
  useEffect(() => {
    let cancelled = false;
    const family = pageFontFamily();
    waitForFonts(family).then(() => !cancelled && setFont(family));
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Capas progressivas: 300 px (cache rápido do Fastly) entra logo para a imagem não ficar
  // vazia; em paralelo baixa 600 px nítido para substituir antes de liberar o download.
  useEffect(() => {
    let cancelled = false;
    const list = albums.slice(0, RECAP_COVERS);
    let pending = list.length;
    const settle = () => {
      pending -= 1;
      if (pending <= 0) setCoversDone(true);
    };
    if (list.length === 0) Promise.resolve().then(() => !cancelled && setCoversDone(true));
    list.forEach((a, i) => {
      albumCover({ ...a, artist: a.artist ?? "" }).then((url) => {
        if (cancelled) return;
        if (!url) {
          settle();
          return;
        }
        let gotHd = false;
        const fastUrl = coverUrl(url, 300);
        // Imagem em 1,5x: a capa principal (nº 1) pede a original; as outras, 600 px.
        const hdPx = recapCoverPx(i);
        const hdUrl = coverUrl(url, hdPx);
        if (fastUrl !== hdUrl) {
          loadImage(fastUrl, 8_000).then((fastImg) => {
            if (cancelled || gotHd || !fastImg) return;
            setCovers((prev) => prev.map((c, j) => (j === i ? fastImg : c)));
            if (i === 0) setCoverPalette(paletteFromCover(fastImg));
          });
        }
        loadImage(hdUrl, hdPx === "original" ? 30_000 : undefined).then((hdImg) => {
          if (cancelled) return;
          gotHd = true;
          if (hdImg) {
            setCovers((prev) => prev.map((c, j) => (j === i ? hdImg : c)));
            if (i === 0) setCoverPalette(paletteFromCover(hdImg));
          }
          settle();
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [albums]);

  // 3) Gêneros: chegam por último (calculados a partir das tags dos artistas).
  useEffect(() => {
    let cancelled = false;
    genres.then((list) => !cancelled && setGenreNames(list ? list.map((g: Genre) => g.name) : null));
    return () => {
      cancelled = true;
    };
  }, [genres]);

  const drawn = font !== null;
  const complete = drawn && coversDone && genreNames !== undefined;

  // 4) Desenha sempre que os dados ou as escolhas mudam (é instantâneo).
  useEffect(() => {
    const canvas = slot === 0 ? canvas0Ref.current : canvas1Ref.current;
    if (!font || !canvas) return;
    drawRecap(
      canvas,
      {
        username,
        title: periodLabel,
        // Datas no fuso do aparelho de quem gera a imagem.
        dateText: dateText(period, from, to, undefined, lang),
        shortTag: shortTag(period, lang),
        total,
        minutes: minutesValue,
        albumHeading: albumHeading(period, lang),
        artists,
        tracks,
        albums,
        covers,
        genres: genreNames,
        siteHost: window.location.host,
      },
      {
        layout: prefs.layout,
        palette,
        showNumbers: prefs.showNumbers,
        showUsername: prefs.showUsername,
        vinylColor: prefs.coloredVinyl ? vinylColor : null,
        font,
        lang,
      },
    );
    // A cópia "segurável" só serve no celular, e só com a imagem completa.
    if (complete) takeSnapshot(canvas);
  }, [font, slot, covers, genreNames, complete, prefs, palette, vinylColor, username, period, periodLabel, from, to, total, minutesValue, artists, tracks, albums, takeSnapshot, lang]);

  const coverAccent = coverPalette?.accent;
  const altText = t.recap.alt(username, periodLabel, t.recap.layouts[prefs.layout]);
  const layoutIndex = Math.max(0, RECAP_LAYOUTS.findIndex((l) => l.id === prefs.layout));
  const layoutCol = layoutIndex % 2;
  const layoutRow = Math.floor(layoutIndex / 2);
  const isTurntable = prefs.layout === "toca-discos";

  const activePaletteLabel =
    prefs.paletteId === COVER_PALETTE_ID
      ? t.recap.coverColor
      : (t.recap.palettes[prefs.paletteId] ?? palette.name);

  return (
    <section
      aria-labelledby="recap-titulo"
      className="overflow-hidden rounded-[28px] border border-stage-line bg-stage p-4 text-stage-ink shadow-xl motion-safe:animate-rise sm:p-6 lg:p-8"
    >
      <h2 id="recap-titulo" className="sr-only">
        {t.recap.heading}
      </h2>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-8 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,32rem)_1fr]">
        <div className="mx-auto w-full max-w-xs transition-transform duration-300 ease-smooth hover:-translate-y-0.5 lg:max-w-[22.5rem] xl:max-w-[24rem]">
          <div className="relative aspect-[9/16] w-full">
            {([0, 1] as const).map((i) => {
              const isActive = i === slot;
              return (
                <canvas
                  key={i}
                  ref={i === 0 ? canvas0Ref : canvas1Ref}
                  width={RECAP_WIDTH}
                  height={RECAP_HEIGHT}
                  // Sem a cópia em <img> (computador), o canvas ativo é a imagem para leitores de tela.
                  role={isActive && !snapshot ? "img" : undefined}
                  aria-label={isActive && !snapshot ? altText : undefined}
                  aria-hidden={!isActive || Boolean(snapshot) ? true : undefined}
                  className={
                    "absolute inset-0 block size-full rounded-2xl bg-stage-card shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-[opacity,transform] ease-smooth motion-reduce:transition-none " +
                    (isActive
                      ? "z-10 scale-100 opacity-100 duration-300"
                      : "pointer-events-none z-0 scale-[0.97] opacity-0 duration-200")
                  }
                />
              );
            })}
            {snapshot && (
              // Cópia em PNG por cima do canvas: no celular, segurar o dedo abre "Salvar imagem".
              // eslint-disable-next-line @next/next/no-img-element
              <img src={snapshot} alt={altText} className="absolute inset-0 z-20 size-full rounded-2xl" />
            )}
            {!drawn && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-stage-card">
                <VinylLoader label={t.recap.building} />
              </div>
            )}
          </div>
          {drawn && !complete && (
            <p role="status" className="mt-2 text-center text-xs text-stage-faint">
              {t.recap.completing}
            </p>
          )}
          {complete && <SaveHint />}
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-stage-line bg-stage-card p-4 sm:p-5 lg:p-6">
          {/* Ficha técnica: período em DM Sans e números em Space Grotesk alinhados. */}
          <div className="text-sm">
            <p className="border-b border-stage-line pb-2 text-xs font-bold uppercase tracking-[0.12em] text-amber">
              {periodLabel}
            </p>
            <dl className="divide-y divide-stage-line border-b border-stage-line">
              <div className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-stage-soft">{t.units.scrobbles}</dt>
                <dd className="font-bold text-stage-ink tabular-nums">{formatNumber(total, lang)}</dd>
              </div>
              {minutesValue !== null && (
                <div className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-stage-soft">{t.units.minutes}</dt>
                  <dd className="font-bold text-stage-ink tabular-nums">{formatNumber(minutesValue, lang)}</dd>
                </div>
              )}
            </dl>
            {minutesValue !== null && <p className="mt-2 text-xs text-stage-faint">{t.recap.minutesNote}</p>}
          </div>

          <fieldset>
            <legend className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              {t.recap.format}
            </legend>
            <div className="relative grid grid-cols-2 rounded-2xl border border-stage-line bg-stage p-1 lg:grid-cols-4 lg:rounded-full">
              {/* Pílula deslizante 2D no celular e tablet (2×2) */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-1 top-1 z-0 h-[calc(50%-0.25rem)] w-[calc(50%-0.25rem)] rounded-xl bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none lg:hidden"
                style={{ transform: `translate(${layoutCol * 100}%, ${layoutRow * 100}%)` }}
              />
              {/* Pílula deslizante em linha única no computador (4×1) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 z-0 hidden w-[calc(25%-0.125rem)] rounded-full bg-amber shadow-sm transition-transform duration-300 ease-smooth motion-reduce:transition-none lg:block"
                style={{ transform: `translateX(${layoutIndex * 100}%)` }}
              />
              {RECAP_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={prefs.layout === l.id}
                  onClick={() => selectLayout(l.id)}
                  className={
                    "relative z-10 whitespace-nowrap rounded-xl px-2.5 py-2 text-center text-sm font-bold transition-colors duration-200 ease-smooth lg:rounded-full " +
                    (prefs.layout === l.id ? "text-amber-ink" : "text-stage-soft hover:text-stage-ink")
                  }
                >
                  {t.recap.layouts[l.id]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2.5 flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-stage-faint">
              <span>{t.recap.color}</span>
              <span className="text-stage-ink">{activePaletteLabel}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {PALETTES.map((p) => (
                <Swatch
                  key={p.id}
                  label={t.recap.palettes[p.id] ?? p.name}
                  active={prefs.paletteId === p.id}
                  onClick={() => choose({ paletteId: p.id })}
                  background={`linear-gradient(135deg, ${p.room} 50%, ${p.accent} 50%)`}
                />
              ))}
              <Swatch
                label={t.recap.coverColor}
                active={prefs.paletteId === COVER_PALETTE_ID}
                onClick={() => choose({ paletteId: COVER_PALETTE_ID })}
                background={
                  coverAccent
                    ? `linear-gradient(135deg, ${coverPalette?.room} 50%, ${coverAccent} 50%)`
                    : "conic-gradient(#e8a13a, #ff7aa2, #c59bff, #6fc3ff, #e8a13a)"
                }
              />
            </div>
          </fieldset>

          <div className="flex flex-col">
            <div
              aria-hidden={!isTurntable}
              className={
                "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-smooth motion-reduce:transition-none " +
                (isTurntable ? "mb-2.5 grid-rows-[1fr] opacity-100" : "pointer-events-none mb-0 grid-rows-[0fr] opacity-0")
              }
            >
              <div className="overflow-hidden">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
                  <span>
                    <span className="flex items-center gap-2 text-sm font-bold text-stage-ink">
                      <span
                        aria-hidden
                        className="size-3 shrink-0 rounded-full ring-1 ring-white/25 transition-colors duration-300 ease-smooth"
                        style={{ backgroundColor: prefs.coloredVinyl && vinylColor ? vinylColor : "var(--color-vinyl)" }}
                      />
                      {t.recap.coloredVinyl}
                    </span>
                    <span className="block text-xs text-stage-soft">{t.recap.coloredVinylHint}</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    tabIndex={isTurntable ? 0 : -1}
                    disabled={!isTurntable}
                    checked={prefs.coloredVinyl}
                    onChange={(e) => choose({ coloredVinyl: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
                  />
                </label>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
              <span>
                <span className="block text-sm font-bold text-stage-ink">{t.recap.showNumbers}</span>
                <span className="block text-xs text-stage-soft">{t.recap.showNumbersHint}</span>
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
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
              />
            </label>

            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stage-line p-3.5 transition-colors duration-200 ease-smooth hover:border-stage-faint has-[:checked]:border-amber/60 has-[:checked]:bg-amber/10">
              <span>
                <span className="block text-sm font-bold text-stage-ink">{t.recap.showUsername}</span>
                <span className="block text-xs text-stage-soft">{t.recap.showUsernameHint}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={prefs.showUsername}
                onChange={(e) => choose({ showUsername: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 ring-1 ring-white/15 transition-colors duration-200 ease-smooth peer-checked:bg-amber peer-checked:ring-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-stage-ink after:transition-[transform,background-color] after:duration-200 after:ease-smooth peer-checked:after:translate-x-5 peer-checked:after:bg-amber-ink"
              />
            </label>
          </div>

          <ExportButtons
            canvasRef={slot === 0 ? canvas0Ref : canvas1Ref}
            // Sem o @ (opção desligada), o nome do arquivo também sai sem o username.
            filename={`recap-${prefs.showUsername ? `${username}-` : ""}${period}-${prefs.layout}.png`}
            shareTitle={t.recap.shareTitle(periodLabel)}
            disabled={!complete}
          />
        </div>
      </div>
    </section>
  );
}

/** Dica de salvar segurando a imagem (só em telas de toque, onde isso funciona). */
export function SaveHint() {
  const { t } = useI18n();
  return (
    <p className="mt-2.5 hidden text-center text-xs text-stage-faint [@media(pointer:coarse)]:block">
      {t.recap.saveHint}
    </p>
  );
}
