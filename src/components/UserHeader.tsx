import Image from "next/image";
import { formatNumber, yearOf } from "@/lib/format";
import type { UserInfo } from "@/lib/lastfm/types";

/** Avatar, username (link para o perfil no Last.fm) e total de scrobbles. */
export function UserHeader({ user }: { user: UserInfo }) {
  const since = yearOf(user.registeredAt);
  return (
    <header className="flex items-center gap-4">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt=""
          width={64}
          height={64}
          loading="eager"
          className="size-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {user.username.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold">
          <a
            href={user.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {user.username}
          </a>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatNumber(user.playcount)} scrobbles{since ? ` desde ${since}` : ""}
        </p>
      </div>
    </header>
  );
}
