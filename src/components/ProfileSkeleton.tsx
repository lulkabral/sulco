"use client";

import { VinylLoader } from "./VinylLoader";

/** Espaço reservado enquanto os dados chegam: blocos parados e o disco girando (docs/MARCA.md). */

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-card-2 ${className}`} />;
}

export function ListsSkeleton() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-[28px] border border-stage-line bg-stage p-8 text-stage-ink">
      <VinylLoader />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div aria-hidden className="overflow-hidden rounded-[26px] border border-line bg-card">
        <div className="h-[92px] bg-stage" />
        <div className="flex items-center gap-4 px-5 pb-4 pt-3">
          <div className="-mt-10 size-24 rounded-full border-4 border-card bg-card-2" />
          <div className="flex flex-col gap-2">
            <Bar className="h-7 w-40" />
            <Bar className="h-4 w-32" />
          </div>
        </div>
      </div>
      <ListsSkeleton />
    </div>
  );
}

/** Lista de gêneros (que chega depois das outras): um disco pequeno. */
export function GenresSkeleton() {
  return <VinylLoader size="sm" className="items-start py-2" />;
}
