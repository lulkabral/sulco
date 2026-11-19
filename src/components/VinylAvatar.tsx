import Image from "next/image";
import { thumbUrl } from "@/lib/grid/layout";

type Props = {
  /** Foto do perfil no Last.fm (ou null: aparece a inicial). */
  avatarUrl: string | null;
  username: string;
};

/**
 * Avatar como selo de um disco de vinil girando (a referência ao "sulco").
 * Gira só o disco (sulcos, brilho e a marquinha âmbar); a foto fica parada, para o rosto
 * não virar de cabeça para baixo. Para quem pediu "reduzir movimento", o disco fica parado.
 */
export function VinylAvatar({ avatarUrl, username }: Props) {
  return (
    <div aria-hidden className="relative size-24 shrink-0">
      {/* Disco: sulcos + brilho + marquinha na borda, tudo girando junto. */}
      <div
        className="absolute inset-0 rounded-full shadow-xl shadow-black/60 ring-1 ring-white/10 motion-safe:animate-spin-slow"
        style={{ background: "repeating-radial-gradient(circle, var(--color-vinyl) 0 2px, var(--color-vinyl-groove) 2px 4px)" }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 20deg, transparent 0 8%, rgba(255,255,255,0.16) 12%, transparent 17%, transparent 58%, rgba(255,255,255,0.1) 62%, transparent 67%)",
          }}
        />
        <span className="absolute top-[3%] left-1/2 h-[8%] w-[4%] -translate-x-1/2 rounded-full bg-amber" />
      </div>
      {/* Selo: a foto da pessoa, parada, com aro âmbar. O disco é só um aro fino em volta. */}
      <div className="absolute inset-[15%] overflow-hidden rounded-full bg-stage ring-2 ring-amber">
        {avatarUrl ? (
          <Image
            src={thumbUrl(avatarUrl)}
            alt=""
            width={72}
            height={72}
            loading="eager"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xl font-extrabold uppercase text-amber">
            {username.charAt(0)}
          </span>
        )}
      </div>
    </div>
  );
}
