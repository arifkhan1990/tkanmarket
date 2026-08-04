/** Skeleton mirrors blog detail: progress strip, hero, grid, related strip. */
export default function BlogPostLoading() {
  return (
    <div className="bg-surface">
      <div className="fixed left-0 right-0 top-14 z-40 h-0.5 bg-surface-container-high md:top-[4.25rem]">
        <div className="h-full w-1/3 animate-pulse bg-primary/40" />
      </div>
      <div className="h-[min(420px,70vh)] min-h-[280px] w-full animate-pulse bg-surface-container-high" />
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
          <div className="hidden min-w-0 lg:col-span-2 lg:block">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-full animate-pulse rounded bg-surface-container-high" />
              ))}
            </div>
          </div>
          <div className="min-w-0 space-y-6 lg:col-span-6">
            <div className="h-24 animate-pulse rounded-lg bg-surface-container-high" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-surface-container-high" />
            ))}
          </div>
          <div className="min-w-0 space-y-6 lg:col-span-4">
            <div className="h-56 animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="h-44 animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
          </div>
        </div>
      </div>
      <div className="border-t border-outline-variant/20 bg-surface-container-low py-16 md:py-24">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 h-8 max-w-sm animate-pulse rounded bg-surface-container-highest" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-container-highest" />
                <div className="h-4 w-20 animate-pulse rounded bg-surface-container-highest" />
                <div className="h-6 w-full animate-pulse rounded bg-surface-container-highest" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
