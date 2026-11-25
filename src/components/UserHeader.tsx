import { getI18n } from "@/i18n/server";
import { formatNumber, yearOf } from "@/lib/format";
import type { UserInfo } from "@/lib/lastfm/types";
import { ArrowUpRightIcon } from "./Icons";
import { Marquee } from "./Marquee";
import { VinylAvatar } from "./VinylAvatar";

type Props = {
  user: UserInfo;
  /** Capas dos álbuns mais ouvidos (do último ano), para a faixa do topo. */
  covers: string[];
};

/**
 * Cartão-topo da página do usuário: faixa limpa de capas do ano (retas, sem fita),
 * avatar como selo de um disco de vinil girando, username e etiquetas em mono.
 */
export async function UserHeader({ user, covers }: Props) {
  const { lang, t } = await getI18n();
  const since = yearOf(user.registeredAt);
  return (
    <section className="overflow-hidden rounded-[26px] border border-line bg-card shadow-sm">
      <div className="relative overflow-hidden border-b border-rule bg-stage py-3">
        {covers.length > 0 ? (
          <Marquee covers={covers} size={68} seconds={Math.max(48, covers.length * 4.5)} />
        ) : (
          <Marquee size={68} seconds={90} />
        )}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-stage to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-stage to-transparent" />
      </div>

      <div className="relative flex flex-wrap items-center gap-4 px-4 pb-4 pt-3 sm:px-6">
        <div className="-mt-10">
          <VinylAvatar avatarUrl={user.avatarUrl} username={user.username} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            <a
              href={user.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors duration-200 ease-smooth hover:text-terra-text"
            >
              <span className="truncate">{user.username}</span>
              <ArrowUpRightIcon className="size-3.5 shrink-0 text-ink-faint" />
            </a>
          </h1>
          <ul className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <li className="rounded-full bg-card-2 px-3 py-1 text-soft">
              <span className="font-bold text-ink tabular-nums">{formatNumber(user.playcount, lang)}</span>{" "}
              {t.units.scrobbles}
            </li>
            {since && (
              <li className="rounded-full border border-line px-3 py-1 text-soft tabular-nums">
                {t.profile.sinceYear(since)}
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
