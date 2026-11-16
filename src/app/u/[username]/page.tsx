import type { Metadata } from "next";
import { artistImages } from "@/lib/artist-image";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlbumGrid } from "@/components/AlbumGrid";
import { ErrorState } from "@/components/ErrorState";
import { GenreList } from "@/components/GenreList";
import { MonthView } from "@/components/MonthView";
import { PeriodSelector } from "@/components/PeriodSelector";
import { ListsSkeleton, ProfileSkeleton } from "@/components/ProfileSkeleton";
import { ProfileTabs } from "@/components/ProfileTabs";
import { RecapImage } from "@/components/RecapImage";
import { TopList } from "@/components/TopList";
import { UserHeader } from "@/components/UserHeader";
import { GENRE_ARTISTS } from "@/lib/genres";
import { getScrobbleTotal, getTop, getTopGenres, getUserInfo } from "@/lib/lastfm/client";
import { LastfmError } from "@/lib/lastfm/errors";
import type { ErrorCode, TopAlbum, TopArtist, TopTrack } from "@/lib/lastfm/types";
import { validateUsername } from "@/lib/lastfm/validate";
import {
  DEFAULT_GRID_PERIOD,
  DEFAULT_UI_PERIOD,
  parseUiPeriod,
  periodLabel,
  currentPeriodRange,
  UI_PERIODS,
  type UiPeriod,
} from "@/lib/periods";
import { currentMonthsSince, currentYearsSince, monthLabel, parseYearId, yearLabel } from "@/lib/months";
import { parseTab, type Tab } from "@/lib/tabs";

const LIST_LIMIT = 10;
/** Álbuns buscados: o bastante para a grade 5x5. As listas mostram só LIST_LIMIT. */
const ALBUM_LIMIT = 25;
/** Itens na imagem do recap: até 15 artistas (Lineup), 5 músicas e 9 álbuns (Mosaico). */
const RECAP_ARTISTS = 15;
const RECAP_TRACKS = 5;
const RECAP_ALBUMS = 9;
/** Capas na faixa do topo da página. */
const HEADER_COVERS = 20;

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const username = validateUsername(safeDecode((await params).username));
  return {
    title: username.ok ? username.value : "Usuário",
    description: username.ok
      ? `Recap e grade de álbuns de ${username.value}, a partir do Last.fm.`
      : undefined,
    // Páginas de usuário não entram em buscadores (o username fica fora do Google).
    robots: { index: false, follow: true },
  };
}

// O username e o período só são conhecidos na hora do pedido,
// então tudo que depende deles fica dentro de <Suspense>.
export default function UserPage({ params, searchParams }: PageProps<"/u/[username]">) {
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-10 sm:pt-6">
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
  const rawPeriod = Array.isArray(query.period) ? query.period[0] : query.period;
  const period = parseUiPeriod(query.period, tab === "grade" ? DEFAULT_GRID_PERIOD : DEFAULT_UI_PERIOD);

  const username = validateUsername(safeDecode(rawUsername));
  if (!username.ok) {
    return <ErrorState code="BAD_REQUEST" username={safeDecode(rawUsername)} />;
  }

  let user;
  let covers: string[] = [];
  try {
    // 2 chamadas juntas: dados do usuário e capas do último ano para a faixa do topo
    // (a faixa não muda ao trocar de período). Se só as capas falharem, segue sem elas.
    const [info, topAlbums] = await Promise.all([
      getUserInfo(username.value),
      getTop(username.value, "albums", "12month", HEADER_COVERS).catch(() => null),
    ]);
    user = info;
    covers = ((topAlbums?.items ?? []) as TopAlbum[])
      .map((a) => a.imageUrl)
      .filter((url): url is string => url !== null);
  } catch (err) {
    return <ErrorState code={errorCodeOf(err)} username={username.value} />;
  }

  // "Escolher mês ou ano": os meses fechados vão do cadastro até o mês passado.
  // Dependem da data de hoje: `connection()` diz ao Next que isto roda a cada pedido.
  await connection();
  const months = currentMonthsSince(user.registeredAt);
  const years = currentYearsSince(user.registeredAt);
  // Mês fechado ("2026-10") ou ano ("2025"), só se estiverem nessas listas;
  // senão, um período do Last.fm.
  const month = rawPeriod && (months as string[]).includes(rawPeriod) ? rawPeriod : null;
  const yearNumber = parseYearId(rawPeriod);
  const year = yearNumber !== null && years.includes(yearNumber) ? yearNumber : null;
  const history = month ?? (year !== null ? String(year) : null);
  // O ano mais recente da lista é o corrente: ele ainda está "até agora".
  const historyLabel = month ? monthLabel(month) : year !== null ? yearLabel(year, year === years[0]) : "";
  const current = history ?? period;
  // Só repassamos o período para a outra aba se a pessoa escolheu um (cada aba tem seu padrão).
  const chosenPeriod = history ?? (UI_PERIODS.some((p) => p.value === rawPeriod) ? period : undefined);

  return (
    <>
      <UserHeader user={user} covers={covers} />
      <ProfileTabs username={user.username} current={tab} period={chosenPeriod} />
      <PeriodSelector username={user.username} current={current} tab={tab} months={months} years={years} />
      {history ? (
        // Mês ou ano escolhido no calendário: os dados são montados no navegador (SPEC, "Mês fechado").
        <MonthView key={history} username={user.username} period={history} label={historyLabel} tab={tab} />
      ) : (
        // key: ao trocar de período mostra o esqueleto; ao trocar de aba, a tela atual fica até a nova chegar
        <Suspense key={period} fallback={<ListsSkeleton />}>
          <TopLists
            username={user.username}
            period={period}
            tab={tab}
            registeredAt={user.registeredAt}
            lifetimeTotal={user.playcount}
          />
        </Suspense>
      )}
    </>
  );
}

type TopListsProps = {
  username: string;
  period: UiPeriod;
  tab: Tab;
  /** Data de cadastro (início de "Todo o tempo"). */
  registeredAt: number;
  /** Total de scrobbles da vida inteira (já vem no perfil). */
  lifetimeTotal: number;
};

async function TopLists({ username, period, tab, registeredAt, lifetimeTotal }: TopListsProps) {
  // O intervalo depende da hora atual: `connection()` diz ao Next que isto roda a cada pedido.
  await connection();
  const range = currentPeriodRange(period, registeredAt);
  // Em "Todo o tempo" o total já veio no perfil: não precisa da chamada extra.
  const needsTotal = tab === "recap" && period !== "overall";

  let artists, tracks, albums, total;
  try {
    // Até 4 chamadas ao mesmo tempo (limite do projeto). O total só é preciso no recap.
    [artists, tracks, albums, total] = await Promise.all([
      // 20 artistas: a lista mostra 10, o cálculo de gêneros usa todos.
      getTop(username, "artists", period, GENRE_ARTISTS),
      getTop(username, "tracks", period, LIST_LIMIT),
      getTop(username, "albums", period, ALBUM_LIMIT),
      needsTotal ? getScrobbleTotal(username, range.from, range.to) : null,
    ]);
  } catch (err) {
    return <ErrorState code={errorCodeOf(err)} username={username} />;
  }

  if (artists.items.length === 0 && tracks.items.length === 0 && albums.items.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5">
        <h2 className="text-lg font-semibold">Nenhuma música neste período</h2>
        <p className="mt-1 text-ink-soft">
          Não há scrobbles em “{periodLabel(period).toLowerCase()}”. Tente um período maior.
        </p>
      </div>
    );
  }

  const albumItems = albums.items as TopAlbum[];
  const artistItems = artists.items as TopArtist[];
  const artistPics = artistImages(artistItems.slice(0, LIST_LIMIT), albumItems);

  // Começa o cálculo de gêneros (até 20 buscas de tags, 3 por vez) sem esperar:
  // as listas aparecem já, e a lista de gêneros e a imagem do recap recebem a "promessa".
  const genres = getTopGenres(
    artistItems.map((a) => ({ name: a.name, playcount: a.playcount })),
  );

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
        <RecapImage
          username={username}
          period={period}
          periodLabel={periodLabel(period)}
          from={range.from}
          to={range.to}
          total={period === "overall" ? lifetimeTotal : (total ?? 0)}
          genres={genres}
          artists={artistItems
            .slice(0, RECAP_ARTISTS)
            .map((a) => ({ name: a.name, playcount: a.playcount }))}
          tracks={(tracks.items as TopTrack[])
            .slice(0, RECAP_TRACKS)
            .map((t) => ({ name: t.name, artist: t.artist, playcount: t.playcount }))}
          albums={albumItems.slice(0, RECAP_ALBUMS).map((a) => ({
            name: a.name,
            artist: a.artist,
            playcount: a.playcount,
            imageUrl: a.imageUrl,
          }))}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TopList
          title="Artistas"
          icon="artists"
          items={artistItems.slice(0, LIST_LIMIT).map((a, i) => ({
            rank: a.rank,
            name: a.name,
            playcount: a.playcount,
            url: a.url,
            image: artistPics[i],
          }))}
        />
        <TopList
          title="Músicas"
          icon="tracks"
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
          icon="albums"
          items={albumItems.slice(0, LIST_LIMIT).map((a) => ({
            rank: a.rank,
            name: a.name,
            detail: a.artist,
            playcount: a.playcount,
            url: a.url,
          }))}
        />
        <GenreList genres={genres} />
      </div>
    </>
  );
}
