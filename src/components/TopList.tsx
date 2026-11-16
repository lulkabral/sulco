import { formatPlays } from "@/lib/format";
import { thumbUrl } from "@/lib/grid/layout";
import { ListIcon, type ListIconName } from "./ListIcons";

export type TopListItem = {
  rank: number;
  name: string;
  /** Linha de baixo (artista), quando houver. */
  detail?: string;
  playcount: number;
  url: string;
  /** Imagem redonda ao lado do nome (artistas). `null` mostra a inicial. */
  image?: string | null;
};

type Props = {
  title: string;
  icon: ListIconName;
  items: TopListItem[];
};

/**
 * Lista numerada de um top, num cartão. Cada item leva para a página no Last.fm
 * e tem uma barrinha proporcional ao 1º colocado (que cresce ao aparecer).
 */
export function TopList({ title, icon, items }: Props) {
  const top = items[0]?.playcount || 1;
  return (
    <section aria-labelledby={`top-${title}`} className="min-w-0 rounded-2xl bg-card p-4 motion-safe:animate-rise">
      <h2 id={`top-${title}`} className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
        <ListIcon name={icon} />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Nada neste período.</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {items.map((item, i) => (
            <li
              key={`${item.rank}-${item.name}`}
              className={`flex gap-3 ${item.image !== undefined ? "items-center" : "items-baseline"}`}
            >
              <span className="w-5 shrink-0 text-right text-sm font-extrabold tabular-nums text-amber">
                {item.rank}
              </span>
              {item.image !== undefined && <Avatar name={item.name} image={item.image} />}
              <div className="min-w-0 flex-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-semibold hover:text-amber"
                >
                  {item.name}
                </a>
                <p className="truncate text-sm text-ink-soft">
                  {item.detail ? `${item.detail} · ` : ""}
                  {formatPlays(item.playcount)}
                </p>
                <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full origin-left rounded-full bg-amber motion-safe:animate-grow"
                    style={{
                      width: `${Math.max(3, Math.round((item.playcount / top) * 100))}%`,
                      opacity: i === 0 ? 1 : 0.65,
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Bolinha com a imagem (miniatura direto do Last.fm) ou, sem imagem, a inicial do nome. */
function Avatar({ name, image }: { name: string; image: string | null }) {
  if (!image) {
    return (
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card-2 font-extrabold uppercase text-amber ring-1 ring-line"
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbUrl(image)}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      className="size-10 shrink-0 rounded-full object-cover ring-1 ring-line"
    />
  );
}
