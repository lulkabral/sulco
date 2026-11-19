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
 * da linha). Atrás de cada capa, um disco girando com a capa como selo; com o mouse em cima,
 * ele sai da capa. Tudo para com "reduzir movimento". Sem capas suficientes, mostra as faixas abstratas.
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
        <ol className="grid grid-cols-2 gap-px overflow-x-clip bg-rule sm:grid-cols-3 lg:grid-cols-6">
          {items.map((cover, i) => (
            <li key={cover.imageUrl} className="group relative bg-room p-4 hover:z-10 sm:p-5">
              <div className="relative w-[72%]">
                {/* Disco guardado atrás da capa: já aparece um pouco e gira devagar; com o mouse
                    em cima, sai da capa (por cima da célula vizinha, mostrando o selo) e gira na
                    velocidade do toca-discos. No celular (sem mouse), fica mais para fora dentro da
                    célula. O selo é a própria capa, como na imagem Toca-discos. */}
                <div
                  aria-hidden
                  className="absolute inset-0 translate-x-[20%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:translate-x-[64%] [@media(pointer:coarse)]:translate-x-[34%]"
                >
                  <div
                    className="relative size-full rounded-full shadow-xl shadow-black/70 ring-1 ring-white/20 motion-safe:animate-spin-slow motion-safe:group-hover:animate-record"
                    style={{ background: "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)" }}
                  >
                    {/* Reflexo: é ele que mostra o disco girando. */}
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "conic-gradient(from 20deg, transparent 0 8%, rgba(255,255,255,0.16) 12%, transparent 17%, transparent 58%, rgba(255,255,255,0.09) 62%, transparent 67%)",
                      }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.imageUrl}
                      alt=""
                      width={120}
                      height={120}
                      loading="lazy"
                      className="absolute inset-[31%] size-[38%] rounded-full object-cover ring-2 ring-black/60"
                    />
                    <span className="absolute inset-[48%] rounded-full bg-room" />
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.imageUrl}
                  alt=""
                  width={300}
                  height={300}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="relative block aspect-square w-full border border-line bg-card object-cover shadow-lg shadow-black/50"
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
