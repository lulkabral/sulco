import type { Metadata } from "next";
import { artistPictures } from "@/lib/artist-image";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccentScope } from "@/components/AccentScope";
import { AlbumGrid } from "@/components/AlbumGrid";
import { ErrorState } from "@/components/ErrorState";
import { GenreList } from "@/components/GenreList";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoLink } from "@/components/Logo";
import { MonthView } from "@/components/MonthView";
import { PeriodSelector } from "@/components/PeriodSelector";
import { ProfileLists } from "@/components/ProfileLists";
import { ListsSkeleton, ProfileSkeleton } from "@/components/ProfileSkeleton";
import { ProfileTabs } from "@/components/ProfileTabs";
import { QuickUserSwitch } from "@/components/QuickUserSwitch";
import { RecapImage } from "@/components/RecapImage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopList } from "@/components/TopList";
import { UserHeader } from "@/components/UserHeader";
import { getI18n } from "@/i18n/server";
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
/** Músicas usadas para estimar os minutos (as mesmas da lista "Músicas"). */
const MINUTE_SAMPLE = 10;
const RECAP_ALBUMS = 9;
/** Capas na faixa do topo da página. */
const HEADER_COVERS = 20;

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[username]">): Promise<Metadata> {
  const username = validateUsername(safeDecode((await params).username));
  const { t } = await getI18n();
  return {
    title: username.ok ? username.value : t.profile.fallbackTitle,
    description: username.ok ? t.profile.metaDescription(username.value) : undefined,
    // Páginas de usuário não entram em buscadores (o username fica fora do Google).
    robots: { index: false, follow: true },
  };
}

// O username e o período só são conhecidos na hora do pedido,
// então tudo que depende deles fica dentro de <Suspense>.
export default function UserPage({ params, searchParams }: PageProps<"/[lang]/u/[username]">) {
  return (
    <main id="conteudo" className="flex w-full flex-1 flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-[88rem] items-center justify-between gap-2 px-4 sm:px-6 lg:px-10">
          <LogoLink />
          <div className="flex items-center gap-2">
            <QuickUserSwitch />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col gap-5 px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <Suspense fallback={<ProfileSkeleton />}>
          <Profile params={params} searchParams={searchParams} />
        </Suspense>
      </div>
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

async function Profile({ params, searchParams }: Pick<PageProps<"/[lang]/u/[username]">, "params" | "searchParams">) {
  const { username: rawUsername } = await params;
  const query = await searchParams;
  const tab = parseTab(query.tab);
  const rawPeriod = Array.isArray(query.period) ? query.period[0] : query.period;
  const period = parseUiPeriod(query.period, tab === "grade" ? DEFAULT_GRID_PERIOD : DEFAULT_UI_PERIOD);

  const { lang } = await getI18n();
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
  const historyLabel = month ? monthLabel(month, lang) : year !== null ? yearLabel(year, year === years[0], lang) : "";
  const current = history ?? period;
  // Só repassamos o período para a outra aba se a pessoa escolheu um (cada aba tem seu padrão).
  const chosenPeriod = history ?? (UI_PERIODS.some((p) => p.value === rawPeriod) ? period : undefined);

  return (
    // O destaque do palco segue a paleta escolhida para a imagem (quando passa no contraste).
    <AccentScope>
      <UserHeader user={user} covers={covers} />
      {/* Abas e período numa linha só (o calendário fica guardado na gaveta do botão de período). */}
      <div className="flex items-center gap-2.5">
        <ProfileTabs username={user.username} current={tab} period={chosenPeriod} />
        <PeriodSelector username={user.username} current={current} tab={tab} months={months} years={years} />
      </div>
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
    </AccentScope>
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
  const { lang, t } = await getI18n();
  const label = periodLabel(period, lang);
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
      <div className="rounded-[24px] border border-line bg-card p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-ink">{t.profile.noMusicTitle}</h2>
        <p className="mt-1 text-soft">{t.profile.noMusicBody(label)}</p>
      </div>
    );
  }

  const albumItems = albums.items as TopAlbum[];
  const artistItems = artists.items as TopArtist[];
  const artistPics = artistPictures(artistItems, albumItems, tracks.items as TopTrack[]);
  // Para as bolinhas dos gêneros: os artistas que entram no cálculo (até 20).
  const artistPicsByName = Object.fromEntries(artistItems.map((a, i) => [a.name, artistPics[i]]));

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
          periodLabel={label}
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
          periodLabel={label}
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
          minuteSample={(tracks.items as TopTrack[])
            .slice(0, MINUTE_SAMPLE)
            .map((t) => ({ name: t.name, artist: t.artist, playcount: t.playcount }))}
          albums={albumItems.slice(0, RECAP_ALBUMS).map((a) => ({
            name: a.name,
            artist: a.artist,
            playcount: a.playcount,
            imageUrl: a.imageUrl,
          }))}
        />
      )}
      <ProfileLists
        artists={
          <TopList
            title={t.lists.artists}
            icon="artists"
            shape="round"
            items={artistItems.slice(0, LIST_LIMIT).map((a, i) => ({
              rank: a.rank,
              name: a.name,
              playcount: a.playcount,
              url: a.url,
              image: artistPics[i].image,
              lookup: artistPics[i].lookup,
            }))}
          />
        }
        tracks={
          <TopList
            title={t.lists.tracks}
            icon="tracks"
            items={(tracks.items as TopTrack[]).map((t) => ({
              rank: t.rank,
              name: t.name,
              detail: t.artist,
              playcount: t.playcount,
              url: t.url,
              image: t.imageUrl ?? null,
              lookup: { type: "track", artist: t.artist, name: t.name },
            }))}
          />
        }
        albums={
          <TopList
            title={t.lists.albums}
            icon="albums"
            items={albumItems.slice(0, LIST_LIMIT).map((a) => ({
              rank: a.rank,
              name: a.name,
              detail: a.artist,
              playcount: a.playcount,
              url: a.url,
              image: a.imageUrl,
              lookup: { type: "album", artist: a.artist, name: a.name },
            }))}
          />
        }
        genres={<GenreList genres={genres} images={artistPicsByName} />}
      />
    </>
  );
}
