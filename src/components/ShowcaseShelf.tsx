import { getI18n } from "@/i18n/server";
import type { TrendingCover } from "@/lib/trending";
import { Marquee } from "./Marquee";

/** A prateleira tem 6 lugares (como a vitrine em src/data/vitrine.json). */
const SHELF_SIZE = 6;

type Props = {
  covers: TrendingCover[];
  /** Legenda da vitrine (vitrine.json) ou a dos álbuns em alta. */
  caption: string;
};

/**
 * Vitrine da página inicial em forma de prateleira de catálogo: capas retas com borda fina,
 * número de catálogo, álbum e artista. Linhas de 1px entre os itens (gap de 1px sobre a cor
 * da linha). No computador, passar o mouse tira um disco de dentro da capa (só com movimento
 * liberado). Sem capas suficientes, mostra as faixas abstratas.
 */
export async function ShowcaseShelf({ covers, caption }: Props) {
  const { t } = await getI18n();
  const items = covers.slice(0, SHELF_SIZE);

  return (
    <section aria-labelledby="vitrine-titulo" className="border-b border-rule">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-4 py-4 sm:px-8">
        <h2 id="vitrine-titulo" className="font-mono text-xs font-medium tracking-[0.16em] text-soft uppercase">
          {t.home.shelfLabel}
        </h2>
        <p className="font-mono text-xs tracking-[0.12em] text-ink-faint uppercase">{caption}</p>
      </div>

      {items.length >= 4 ? (
        <ol className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 lg:grid-cols-6">
          {items.map((cover, i) => (
            <li key={cover.imageUrl} className="group overflow-hidden bg-room p-4 sm:p-5">
              <div className="relative">
                {/* Disco guardado atrás da capa: sai um pouco pela direita no hover. */}
                <span
                  aria-hidden
                  className="absolute inset-[4%] rounded-full shadow-lg shadow-black/60 transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-[16%]"
                  style={{ background: "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)" }}
                >
                  <span className="absolute inset-[36%] rounded-full bg-card-2 ring-1 ring-line" />
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.imageUrl}
                  alt=""
                  width={300}
                  height={300}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="relative block aspect-square w-full border border-line bg-card object-cover"
                />
              </div>
              <p className="mt-3 font-mono text-[11px] text-ink-faint tabular-nums">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 truncate text-sm font-semibold text-ink" title={t.home.shelfItem(cover.name, cover.artist)}>
                {cover.name}
              </p>
              <p className="truncate text-sm text-soft">{cover.artist}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div aria-hidden className="flex flex-col gap-2 py-6">
          <Marquee size={72} seconds={70} />
          <Marquee size={72} seconds={90} reverse offset={5} />
        </div>
      )}
    </section>
  );
}
