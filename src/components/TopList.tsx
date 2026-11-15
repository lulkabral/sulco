import { formatPlays } from "@/lib/format";

export type TopListItem = {
  rank: number;
  name: string;
  /** Linha de baixo (artista), quando houver. */
  detail?: string;
  playcount: number;
  url: string;
};

type Props = {
  title: string;
  items: TopListItem[];
};

/** Lista numerada de um top, em texto. Cada item leva para a página no Last.fm. */
export function TopList({ title, items }: Props) {
  return (
    <section aria-labelledby={`top-${title}`} className="min-w-0">
      <h2 id={`top-${title}`} className="mb-3 text-lg font-semibold">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Nada neste período.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={`${item.rank}-${item.name}`} className="flex items-baseline gap-3">
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-500">
                {item.rank}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-medium hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  {item.name}
                </a>
                <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {item.detail ? `${item.detail} · ` : ""}
                  {formatPlays(item.playcount)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
