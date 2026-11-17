"use client";

import { useI18n } from "@/i18n/client";

/** Blocos escuros enquanto os dados chegam. */

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-card-2 ${className}`} />;
}

export function ListsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="h-48 rounded-2xl bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col gap-3 rounded-2xl bg-card p-4">
            <Bar className="h-4 w-24" />
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Bar className="h-4 w-3/4" />
                <Bar className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" role="status">
        {t.profile.loading}
      </p>
      <div aria-hidden className="-mx-4 h-[88px] bg-card motion-safe:animate-pulse sm:mx-0 sm:rounded-2xl" />
      <div aria-hidden className="-mt-10 flex items-end gap-4 motion-safe:animate-pulse">
        <div className="size-20 rounded-full border-4 border-room bg-card-2" />
        <div className="flex flex-col gap-2 pb-1">
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-32" />
        </div>
      </div>
      <div aria-hidden className="flex flex-wrap gap-2 motion-safe:animate-pulse">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bar key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <ListsSkeleton />
    </div>
  );
}

/** Esqueleto só da lista de gêneros (que chega depois das outras). */
export function GenresSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 motion-safe:animate-pulse">
      {Array.from({ length: 5 }, (_, i) => (
        <Bar key={i} className="h-4 w-2/3" />
      ))}
    </div>
  );
}
