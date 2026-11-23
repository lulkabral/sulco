import { describe, expect, it } from "vitest";
import {
  DEEZER_EMPTY_IMAGE_HASH,
  isAllowedDeezerImageUrl,
  isExactArtistMatch,
  normalizeMatchText,
  pickDeezerAlbumCover,
  pickDeezerArtistPicture,
  pickDeezerTrackCover,
  stripEditionSuffix,
} from "./deezer";

describe("deezer images", () => {
  const validCover = "https://cdn-images.dzcdn.net/images/cover/07ecc6f1b09e9b7b972ec598aabb9762/500x500-000000-80-0-0.jpg";
  const validArtist = "https://cdn-images.dzcdn.net/images/artist/fbd45c09a10daa3d94efaae309f92af5/500x500-000000-80-0-0.jpg";

  it("aceita apenas URLs HTTPS válidas de capa ou artista em *.dzcdn.net e rejeita placeholders", () => {
    expect(isAllowedDeezerImageUrl(validCover)).toBe(true);
    expect(isAllowedDeezerImageUrl(validArtist)).toBe(true);
    expect(isAllowedDeezerImageUrl("http://cdn-images.dzcdn.net/images/cover/07ecc6f1b09e9b7b972ec598aabb9762/500x500.jpg")).toBe(false);
    expect(isAllowedDeezerImageUrl("https://evil.example/images/cover/07ecc6f1b09e9b7b972ec598aabb9762/500x500.jpg")).toBe(false);
    expect(isAllowedDeezerImageUrl("https://cdn-images.dzcdn.net/images/artist//500x500-000000-80-0-0.jpg")).toBe(false);
    expect(
      isAllowedDeezerImageUrl(`https://cdn-images.dzcdn.net/images/artist/${DEEZER_EMPTY_IMAGE_HASH}/500x500-000000-80-0-0.jpg`),
    ).toBe(false);
    expect(isAllowedDeezerImageUrl("https://api.deezer.com/artist/123/image")).toBe(false);
  });

  it("normaliza acentos e sufixos sem zerar títulos entre parênteses", () => {
    expect(normalizeMatchText("ROSALÍA")).toBe("rosalia");
    expect(stripEditionSuffix("Brat (Deluxe Edition)")).toBe("Brat");
    expect(stripEditionSuffix("(What's the Story) Morning Glory?")).toBe("Morning Glory?");
    expect(stripEditionSuffix("(Deluxe)")).toBe("(Deluxe)");
  });

  it("compara artistas com rigor sem confundir homônimos parciais", () => {
    expect(isExactArtistMatch("ROSALÍA", "Rosalia")).toBe(true);
    expect(isExactArtistMatch("Måneskin", "Maneskin")).toBe(true);
    expect(isExactArtistMatch("Florence + The Machine", "Florence and the Machine")).toBe(true);
    expect(isExactArtistMatch("Matthevas", "Matthew Halsall")).toBe(false);
    expect(isExactArtistMatch("Milo", "Milo Jax")).toBe(false);
    expect(isExactArtistMatch("Charli xcx", "Charli XCX & Leo Birenberg")).toBe(false);
  });

  it("escolhe a capa do álbum quando artista e título batem", () => {
    const raw = {
      data: [
        {
          title: "Outro Álbum",
          record_type: "album",
          cover_big: "https://cdn-images.dzcdn.net/images/cover/11111111111111111111111111111111/500x500-000000-80-0-0.jpg",
          artist: { name: "Outro Artista" },
        },
        {
          title: "Warchild II",
          record_type: "album",
          cover_big: validCover,
          artist: { name: "Matthevas" },
        },
      ],
    };
    expect(pickDeezerAlbumCover(raw, "Matthevas", "Warchild II")).toBe(validCover);
    expect(pickDeezerAlbumCover(raw, "Matthevas", "Álbum Inexistente")).toBeNull();
  });

  it("desempata homônimos pelo maior número de fãs e ignora resultados com hash vazio", () => {
    const raw = {
      data: [
        {
          name: "Rosalía",
          nb_fan: 271,
          nb_album: 11,
          picture_big: `https://cdn-images.dzcdn.net/images/artist/${DEEZER_EMPTY_IMAGE_HASH}/500x500-000000-80-0-0.jpg`,
        },
        {
          name: "Rosalía",
          nb_fan: 35,
          nb_album: 3,
          picture_big: "https://cdn-images.dzcdn.net/images/artist/cda6212bf9dbd43fa00009b2c3f94087/500x500-000000-80-0-0.jpg",
        },
        {
          name: "ROSALÍA",
          nb_fan: 1072726,
          nb_album: 37,
          picture_big: validArtist,
        },
      ],
    };
    expect(pickDeezerArtistPicture(raw, "ROSALÍA")).toBe(validArtist);
    expect(pickDeezerArtistPicture(raw, "Artista Desconhecido")).toBeNull();
  });

  it("escolhe a capa da faixa quando artista e música batem", () => {
    const raw = {
      data: [
        {
          title: "Jogada Falsa",
          title_short: "Jogada Falsa",
          artist: { name: "Matthevas" },
          album: { cover_big: validCover },
        },
      ],
    };
    expect(pickDeezerTrackCover(raw, "Matthevas", "Jogada Falsa")).toBe(validCover);
    expect(pickDeezerTrackCover(raw, "Outro", "Jogada Falsa")).toBeNull();
  });
});
