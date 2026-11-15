/** Blocos cinza enquanto os dados chegam. */

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export function ListsSkeleton() {
  return (
    <div aria-hidden className="grid animate-pulse gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((col) => (
        <div key={col} className="flex flex-col gap-3">
          <Bar className="h-6 w-28" />
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bar className="h-4 w-3/4" />
              <Bar className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" role="status">
        Carregando…
      </p>
      <div aria-hidden className="flex animate-pulse items-center gap-4">
        <div className="size-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-col gap-2">
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-32" />
        </div>
      </div>
      <div aria-hidden className="flex animate-pulse flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <ListsSkeleton />
    </div>
  );
}

/** Esqueleto só da lista de gêneros (que chega depois das outras). */
export function GenresSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <Bar key={i} className="h-4 w-2/3" />
      ))}
    </div>
  );
}
