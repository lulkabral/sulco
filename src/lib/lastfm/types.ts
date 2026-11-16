// Tipos do JSON limpo que as nossas rotas devolvem.
// Nada aqui repete o formato cru do Last.fm (`#text`, `@attr`, números em texto).

export const PERIODS = ["overall", "7day", "1month", "3month", "6month", "12month"] as const;
export type Period = (typeof PERIODS)[number];

export const TOP_TYPES = ["artists", "albums", "tracks"] as const;
export type TopType = (typeof TOP_TYPES)[number];

export type UserInfo = {
  username: string;
  /** Nome real informado no perfil, ou null se vazio. */
  name: string | null;
  url: string;
  avatarUrl: string | null;
  playcount: number;
  /** Data de cadastro em timestamp UNIX (segundos). */
  registeredAt: number;
};

export type TopArtist = {
  rank: number;
  name: string;
  playcount: number;
  url: string;
};

export type TopAlbum = {
  rank: number;
  name: string;
  artist: string;
  playcount: number;
  url: string;
  /** Capa no maior tamanho listado (300 px), ou null se não houver. */
  imageUrl: string | null;
};

export type TopTrack = {
  rank: number;
  name: string;
  artist: string;
  playcount: number;
  url: string;
};

export type TopItem = TopArtist | TopAlbum | TopTrack;

export type TopResponse = {
  user: string;
  type: TopType;
  period: Period;
  /** Total de itens distintos no período (ex.: quantos álbuns diferentes). */
  total: number;
  items: TopItem[];
};

export const ERROR_CODES = [
  "USER_NOT_FOUND",
  "PRIVATE_PROFILE",
  "RATE_LIMITED",
  "LASTFM_DOWN",
  "BAD_REQUEST",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type ApiError = {
  error: { code: ErrorCode; message: string };
};

/** Tag de um artista. `count` é a força da tag, de 0 a 100 (a mais forte vale 100). */
export type ArtistTag = {
  name: string;
  count: number;
};

export type ArtistTagsResponse = {
  artist: string;
  tags: ArtistTag[];
};

/** Um scrobble (uma vez que uma música tocou), de `user.getRecentTracks`. */
export type Scrobble = {
  artist: string;
  /** Nome do álbum, ou "" se o Last.fm não souber. */
  album: string;
  name: string;
  url: string;
  /** Capa do álbum (300 px), ou null. */
  imageUrl: string | null;
  /** Quando tocou, em timestamp UNIX (segundos). */
  playedAt: number;
};

export type ScrobblePage = {
  page: number;
  totalPages: number;
  /** Total de scrobbles do intervalo inteiro. */
  total: number;
  tracks: Scrobble[];
};

/** Tops de um intervalo qualquer (gráficos do Last.fm com `from`/`to`). */
export type ChartResponse = {
  type: TopType;
  from: number;
  to: number;
  /** Já em ordem e cortados nos primeiros; álbuns vêm sem capa (o gráfico não traz imagem). */
  items: TopItem[];
  /** Soma dos plays da lista INTEIRA (antes do corte). Nos artistas, é o total de scrobbles. */
  totalPlays: number;
};
