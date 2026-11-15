import { Suspense } from "react";
import { AlbumGrid } from "@/components/AlbumGrid";
import { ErrorState } from "@/components/ErrorState";
import { PeriodSelector } from "@/components/PeriodSelector";
import { ListsSkeleton, ProfileSkeleton } from "@/components/ProfileSkeleton";
import { ProfileTabs } from "@/components/ProfileTabs";
import { TopList } from "@/components/TopList";
import { UserHeader } from "@/components/UserHeader";
import { getTop, getUserInfo } from "@/lib/lastfm/client";
import { LastfmError } from "@/lib/lastfm/errors";
import type { ErrorCode, TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";
import { validateUsername } from "@/lib/lastfm/validate";
import {
  DEFAULT_GRID_PERIOD,
  DEFAULT_UI_PERIOD,
  parseUiPeriod,
  periodLabel,
  UI_PERIODS,
  type UiPeriod,
} from "@/lib/periods";
import { parseTab, type Tab } from "@/lib/tabs";

const LIST_LIMIT = 10;
/** Álbuns buscados: o bastante para a grade 5x5. As listas mostram só LIST_LIMIT. */
const ALBUM_LIMIT = 25;

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
  const query = await searchParams;
  const tab = parseTab(query.tab);
  const period = parseUiPeriod(query.period, tab === "grade" ? DEFAULT_GRID_PERIOD : DEFAULT_UI_PERIOD);
  // Só repassamos o período para a outra aba se a pessoa escolheu um (cada aba tem seu padrão).
  const chosenPeriod = UI_PERIODS.some((p) => p.value === query.period) ? period : undefined;

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
      <ProfileTabs username={user.username} current={tab} period={chosenPeriod} />
      <PeriodSelector username={user.username} current={period} tab={tab} />
      {/* key: ao trocar de período ou aba, mostra o esqueleto de novo enquanto carrega */}
      <Suspense key={`${tab}-${period}`} fallback={<ListsSkeleton />}>
        <TopLists username={user.username} period={period} tab={tab} />
      </Suspense>
    </>
  );
}

async function TopLists({ username, period, tab }: { username: string; period: UiPeriod; tab: Tab }) {
  let artists, tracks, albums;
  try {
    // 3 chamadas ao mesmo tempo (dentro do limite de 3 a 4 do projeto).
    [artists, tracks, albums] = await Promise.all([
      getTop(username, "artists", period, LIST_LIMIT),
      getTop(username, "tracks", period, LIST_LIMIT),
      getTop(username, "albums", period, ALBUM_LIMIT),
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

  const albumItems = albums.items as TopAlbum[];

  return (
    <>
      {tab === "grade" ? (
        <AlbumGrid
          username={username}
          period={period}
          periodLabel={periodLabel(period)}
          albums={albumItems.map((a) => ({
            name: a.name,
            artist: a.artist,
            playcount: a.playcount,
            imageUrl: a.imageUrl,
          }))}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          A imagem do recap chega em breve. Por enquanto, veja seus tops abaixo ou monte a grade de
          álbuns na aba Grade.
        </p>
      )}
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
          items={albumItems.slice(0, LIST_LIMIT).map((a) => ({
            rank: a.rank,
            name: a.name,
            detail: a.artist,
            playcount: a.playcount,
            url: a.url,
          }))}
        />
      </div>
    </>
  );
}
