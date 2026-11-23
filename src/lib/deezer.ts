// Normalização, validação de URL e seleção estrita de imagens (capas de álbum/faixa e fotos
// de artista) vindas da API pública da Deezer. Funções 100% puras para testar sem rede.

/** MD5 da string vazia usado pela Deezer quando um artista/álbum não tem imagem cadastrada. */
export const DEEZER_EMPTY_IMAGE_HASH = "d41d8cd98f00b204e9800998ecf8427e";

const DEEZER_IMAGE_PATH = /^\/images\/(?:cover|artist)\/([0-9a-f]{32})\/\d+x\d+(?:-\d+-\d+-\d+-\d+\.\w+)?$/i;

/**
 * Confere se a URL de imagem é estritamente HTTPS em `*.dzcdn.net`, aponta para `/images/cover/`
 * ou `/images/artist/` com hash MD5 válido e não é o placeholder de imagem vazia.
 */
export function isAllowedDeezerImageUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || !raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (u.hostname !== "dzcdn.net" && !u.hostname.endsWith(".dzcdn.net")) return false;
    const match = u.pathname.match(DEEZER_IMAGE_PATH);
    if (!match) return false;
    return match[1].toLowerCase() !== DEEZER_EMPTY_IMAGE_HASH;
  } catch {
    return false;
  }
}

/** Remove notas de edição entre parênteses/colchetes ou após " - Remaster/Live/Deluxe...". */
export function stripEditionSuffix(value: string): string {
  const stripped = value
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/\s+-\s+(remaster(?:ed)?|live|ao vivo|deluxe|expanded|bonus|radio edit|version|edit|acoustic|mono|stereo|ep|single).*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped || value.trim();
}

/** Normaliza texto de álbum/faixa/artista para comparação: sem acentos, sem sufixos e sem pontuação. */
export function normalizeMatchText(value: string): string {
  const clean = stripEditionSuffix(value);
  return clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeArtistExact(value: string, conjAsAnd: boolean): string {
  const folded = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const withConj = conjAsAnd ? folded.replace(/\s*[&+]\s*/g, " and ") : folded;
  return withConj.replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Comparação estrita para nomes de artista (evita colocar a foto de outro artista parecido
 * ou homônimo parcial, ex.: "Matthevas" vs "Matthew Halsall", "Milo" vs "Milo Jax").
 */
export function isExactArtistMatch(wanted: string, candidate: string): boolean {
  const w = normalizeArtistExact(wanted, false);
  const c = normalizeArtistExact(candidate, false);
  if (!w || !c) return false;
  if (w === c) return true;
  return normalizeArtistExact(wanted, true) === normalizeArtistExact(candidate, true);
}

/** Pontuação de proximidade entre nome pedido e candidato (3 = exato, 2 = contém, 1 = 60%+ dos termos, 0 = rejeita). */
export function textScore(wanted: string, candidate: string): number {
  if (!wanted || !candidate) return 0;
  if (wanted === candidate) return 3;
  if (candidate.includes(wanted) || wanted.includes(candidate)) return 2;
  const wTokens = wanted.split(" ").filter((t) => t.length >= 2);
  const cSet = new Set(candidate.split(" "));
  if (wTokens.length === 0) return 0;
  const hits = wTokens.filter((t) => cSet.has(t)).length;
  return hits / wTokens.length >= 0.6 ? 1 : 0;
}

function pickImageField(obj: Record<string, unknown> | undefined, keys: readonly string[]): string | null {
  if (!obj) return null;
  for (const key of keys) {
    const val = obj[key];
    if (isAllowedDeezerImageUrl(val)) return val;
  }
  return null;
}

const COVER_KEYS = ["cover_big", "cover_xl", "cover_medium", "cover_small"] as const;
const PICTURE_KEYS = ["picture_big", "picture_xl", "picture_medium", "picture_small"] as const;

type RawAlbumItem = {
  title?: unknown;
  record_type?: unknown;
  cover_small?: unknown;
  cover_medium?: unknown;
  cover_big?: unknown;
  cover_xl?: unknown;
  artist?: { name?: unknown };
};

/**
 * Escolhe a capa do álbum na resposta de `search/album` da Deezer exigindo correspondência
 * nos dois lados (artista E título do álbum) e URL válida de `*.dzcdn.net`.
 */
export function pickDeezerAlbumCover(raw: unknown, artist: string, album: string): string | null {
  const data = (raw as { data?: unknown })?.data;
  if (!Array.isArray(data) || data.length === 0) return null;

  const wantedArtist = normalizeMatchText(artist);
  const wantedAlbum = normalizeMatchText(album);
  if (!wantedArtist || !wantedAlbum) return null;

  let best: { score: number; url: string } | null = null;

  for (const item of data as RawAlbumItem[]) {
    if (!item || typeof item !== "object") continue;
    const url = pickImageField(item as Record<string, unknown>, COVER_KEYS);
    if (!url) continue;

    const candArtist = typeof item.artist?.name === "string" ? item.artist.name.trim() : "";
    const candTitle = typeof item.title === "string" ? item.title.trim() : "";
    if (!candArtist || !candTitle) continue;

    const aScore = textScore(wantedArtist, normalizeMatchText(candArtist));
    const tScore = textScore(wantedAlbum, normalizeMatchText(candTitle));
    if (aScore === 0 || tScore === 0) continue;

    // Empate favorece álbuns completos ("album") em relação a singles.
    const albumBonus = item.record_type === "album" ? 0.5 : 0;
    const total = aScore * 2 + tScore * 3 + albumBonus;
    if (!best || total > best.score) {
      best = { score: total, url };
    }
  }

  return best?.url ?? null;
}

type RawArtistItem = {
  name?: unknown;
  nb_fan?: unknown;
  nb_album?: unknown;
  picture_small?: unknown;
  picture_medium?: unknown;
  picture_big?: unknown;
  picture_xl?: unknown;
};

/**
 * Escolhe a foto oficial do artista em `search/artist` da Deezer.
 * Exige correspondência exata do nome (sem sufixos ou substrings) e desempata homônimos
 * pelo maior número de fãs (`nb_fan`) com foto válida.
 */
export function pickDeezerArtistPicture(raw: unknown, artist: string): string | null {
  const data = (raw as { data?: unknown })?.data;
  if (!Array.isArray(data) || data.length === 0) return null;

  let best: { fans: number; albums: number; url: string } | null = null;

  for (const item of data as RawArtistItem[]) {
    if (!item || typeof item !== "object") continue;
    const url = pickImageField(item as Record<string, unknown>, PICTURE_KEYS);
    if (!url) continue;

    const candName = typeof item.name === "string" ? item.name.trim() : "";
    if (!candName || !isExactArtistMatch(artist, candName)) continue;

    const fans = typeof item.nb_fan === "number" && Number.isFinite(item.nb_fan) ? item.nb_fan : 0;
    const albums = typeof item.nb_album === "number" && Number.isFinite(item.nb_album) ? item.nb_album : 0;
    if (!best || fans > best.fans || (fans === best.fans && albums > best.albums)) {
      best = { fans, albums, url };
    }
  }

  return best?.url ?? null;
}

type RawTrackItem = {
  title?: unknown;
  title_short?: unknown;
  artist?: { name?: unknown };
  album?: Record<string, unknown>;
};

/** Escolhe a capa do álbum da música em `search/track` da Deezer quando o Last.fm não tiver capa. */
export function pickDeezerTrackCover(raw: unknown, artist: string, track: string): string | null {
  const data = (raw as { data?: unknown })?.data;
  if (!Array.isArray(data) || data.length === 0) return null;

  const wantedArtist = normalizeMatchText(artist);
  const wantedTrack = normalizeMatchText(track);
  if (!wantedArtist || !wantedTrack) return null;

  let best: { score: number; url: string } | null = null;

  for (const item of data as RawTrackItem[]) {
    if (!item || typeof item !== "object") continue;
    const url = pickImageField(item.album, COVER_KEYS);
    if (!url) continue;

    const candArtist = typeof item.artist?.name === "string" ? item.artist.name.trim() : "";
    const candTitle =
      typeof item.title === "string"
        ? item.title.trim()
        : typeof item.title_short === "string"
          ? item.title_short.trim()
          : "";
    if (!candArtist || !candTitle) continue;

    const aScore = textScore(wantedArtist, normalizeMatchText(candArtist));
    const tScore = Math.max(
      textScore(wantedTrack, normalizeMatchText(candTitle)),
      typeof item.title_short === "string" ? textScore(wantedTrack, normalizeMatchText(item.title_short)) : 0,
    );
    if (aScore === 0 || tScore === 0) continue;

    const total = aScore * 2 + tScore * 3;
    if (!best || total > best.score) {
      best = { score: total, url };
    }
  }

  return best?.url ?? null;
}
