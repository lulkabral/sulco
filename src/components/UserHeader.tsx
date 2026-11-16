import Image from "next/image";
import Link from "next/link";
import { formatNumber, yearOf } from "@/lib/format";
import { thumbUrl } from "@/lib/grid/layout";
import type { UserInfo } from "@/lib/lastfm/types";
import { LogoLink } from "./Logo";
import { Marquee } from "./Marquee";

type Props = {
  user: UserInfo;
  /** Capas dos álbuns mais ouvidos (do último ano), para a faixa do topo. */
  covers: string[];
};

/** Topo da página do usuário: capas dele passando, avatar, username e total de scrobbles. */
export function UserHeader({ user, covers }: Props) {
  const since = yearOf(user.registeredAt);
  return (
    <header className="relative -mx-4 sm:mx-0">
      <div className="flex items-center justify-between px-4 pb-3 pt-4 sm:px-0 sm:pt-0">
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
        <div className="opacity-70">
          <Marquee covers={covers} size={88} seconds={Math.max(40, covers.length * 4)} />
        </div>
      ) : (
        <Marquee size={88} seconds={80} />
      )}
      {/* Escurece a parte de baixo das capas para o nome ficar legível em cima delas. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-room/0 via-room/40 to-room" />

      <div className="relative -mt-10 flex items-end gap-4 px-4 sm:px-0">
        {user.avatarUrl ? (
          <Image
            src={thumbUrl(user.avatarUrl)}
            alt=""
            width={80}
            height={80}
            loading="eager"
            className="size-20 shrink-0 rounded-full border-4 border-room object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-room bg-card text-3xl font-extrabold uppercase text-amber"
          >
            {user.username.charAt(0)}
          </div>
        )}
        <div className="min-w-0 pb-1">
          <h1 className="truncate text-3xl font-extrabold tracking-tight">
            <a href={user.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber">
              {user.username}
            </a>
          </h1>
          <p className="text-sm text-ink-soft">
            {formatNumber(user.playcount)} scrobbles{since ? ` desde ${since}` : ""}
          </p>
        </div>
      </div>
    </header>
  );
}
