"use client";

import { VinylLoader } from "./VinylLoader";

/** Espaço reservado enquanto os dados chegam: blocos parados e o disco girando (docs/MARCA.md). */

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-card-2 ${className}`} />;
}

export function ListsSkeleton() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl bg-card p-8">
      <VinylLoader />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div aria-hidden className="-mx-4 h-[88px] bg-card sm:mx-0 sm:rounded-2xl" />
      <div aria-hidden className="-mt-10 flex items-end gap-4">
        <div className="size-20 rounded-full border-4 border-room bg-card-2" />
        <div className="flex flex-col gap-2 pb-1">
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-32" />
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
