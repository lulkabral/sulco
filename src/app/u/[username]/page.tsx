import { Suspense } from "react";
import { ErrorState } from "@/components/ErrorState";
import { PeriodSelector } from "@/components/PeriodSelector";
import { ListsSkeleton, ProfileSkeleton } from "@/components/ProfileSkeleton";
import { TopList } from "@/components/TopList";
import { UserHeader } from "@/components/UserHeader";
import { getTop, getUserInfo } from "@/lib/lastfm/client";
import { LastfmError } from "@/lib/lastfm/errors";
import type { ErrorCode, TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";
import { validateUsername } from "@/lib/lastfm/validate";
import { parseUiPeriod, periodLabel, type UiPeriod } from "@/lib/periods";

const LIST_LIMIT = 10;

// O username e o período só são conhecidos na hora do pedido,
// então tudo que depende deles fica dentro de <Suspense>.
export default function UserPage({ params, searchParams }: PageProps<"/u/[username]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function errorCodeOf(err: unknown): ErrorCode {
  return err instanceof LastfmError ? err.code : "LASTFM_DOWN";
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function Profile({ params, searchParams }: Pick<PageProps<"/u/[username]">, "params" | "searchParams">) {
  const { username: rawUsername } = await params;
  const period = parseUiPeriod((await searchParams).period);

  const username = validateUsername(safeDecode(rawUsername));
  if (!username.ok) {
    return <ErrorState code="BAD_REQUEST" username={safeDecode(rawUsername)} />;
  }

  let user;
  try {
    user = await getUserInfo(username.value);
  } catch (err) {
    return <ErrorState code={errorCodeOf(err)} username={username.value} />;
  }

  return (
    <>
      <UserHeader user={user} />
      <PeriodSelector username={user.username} current={period} />
      {/* key: ao trocar de período, mostra o esqueleto de novo enquanto carrega */}
      <Suspense key={period} fallback={<ListsSkeleton />}>
        <TopLists username={user.username} period={period} />
      </Suspense>
    </>
  );
}

async function TopLists({ username, period }: { username: string; period: UiPeriod }) {
  let artists, tracks, albums;
  try {
    // 3 chamadas ao mesmo tempo (dentro do limite de 3 a 4 do projeto).
    [artists, tracks, albums] = await Promise.all([
      getTop(username, "artists", period, LIST_LIMIT),
      getTop(username, "tracks", period, LIST_LIMIT),
      getTop(username, "albums", period, LIST_LIMIT),
    ]);
  } catch (err) {
    return <ErrorState code={errorCodeOf(err)} username={username} />;
  }

  if (artists.items.length === 0 && tracks.items.length === 0 && albums.items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Nenhuma música neste período</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Não há scrobbles em “{periodLabel(period).toLowerCase()}”. Tente um período maior.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <TopList
        title="Artistas"
        items={(artists.items as TopArtist[]).map((a) => ({
          rank: a.rank,
          name: a.name,
          playcount: a.playcount,
          url: a.url,
        }))}
      />
      <TopList
        title="Músicas"
        items={(tracks.items as TopTrack[]).map((t) => ({
          rank: t.rank,
          name: t.name,
          detail: t.artist,
          playcount: t.playcount,
          url: t.url,
        }))}
      />
      <TopList
        title="Álbuns"
        items={(albums.items as TopAlbum[]).map((a) => ({
          rank: a.rank,
          name: a.name,
          detail: a.artist,
          playcount: a.playcount,
          url: a.url,
        }))}
      />
    </div>
  );
}
