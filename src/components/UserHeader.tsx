import Link from "next/link";
import { formatNumber, yearOf } from "@/lib/format";
import type { UserInfo } from "@/lib/lastfm/types";
import { LogoLink } from "./Logo";
import { Marquee } from "./Marquee";
import { VinylAvatar } from "./VinylAvatar";

type Props = {
  user: UserInfo;
  /** Capas dos álbuns mais ouvidos (do último ano), para a faixa do topo. */
  covers: string[];
};

/**
 * Topo da página do usuário: as capas do ano dela passando (com cara de colagem), o avatar
 * como selo de um vinil girando, o username grande e os números em etiquetas.
 */
export function UserHeader({ user, covers }: Props) {
  const since = yearOf(user.registeredAt);
  return (
    <header className="relative -mx-4 sm:mx-0">
      <div className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-0 sm:pt-0">
        <LogoLink />
        {/* Não há login: "trocar" é só voltar ao início e digitar outro username. */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-ink-faint hover:text-ink active:scale-95"
        >
          <span aria-hidden>↺</span> Trocar usuário
        </Link>
      </div>
      {covers.length > 0 ? (
        <Marquee covers={covers} size={84} seconds={Math.max(40, covers.length * 4)} collage />
      ) : (
        <Marquee size={84} seconds={80} />
      )}
      {/* Escurece a parte de baixo das capas para o nome ficar legível em cima delas. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-room/0 via-room/80 to-room" />

      {/* O disco avança sobre a faixa; o nome fica logo abaixo dela, legível. */}
      <div className="relative -mt-10 flex items-end gap-3 px-4 sm:px-0">
        <VinylAvatar avatarUrl={user.avatarUrl} username={user.username} />
        <div className="min-w-0 pt-10">
          <h1 className="truncate text-3xl font-extrabold tracking-tighter sm:text-4xl">
            <a href={user.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber">
              {user.username}
            </a>
          </h1>
          <ul className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-xs text-ink-soft">
            <li className="rounded-full border border-line bg-room/70 px-2.5 py-1">
              <span className="font-bold text-ink">{formatNumber(user.playcount)}</span> scrobbles
            </li>
            {since && <li className="rounded-full border border-line bg-room/70 px-2.5 py-1">desde {since}</li>}
          </ul>
        </div>
      </div>
    </header>
  );
}
