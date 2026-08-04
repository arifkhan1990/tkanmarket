export default function AdminSupplierDiscoveryRunLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-40 animate-pulse rounded-md bg-surface-container-high" />
      </div>
      <section className="rounded-xl border border-outline/15 bg-surface/30 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-48 max-w-full animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface-container-high" />
          </div>
          <div className="h-10 w-44 shrink-0 animate-pulse rounded-md bg-surface-container-highest" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
              <div className="h-10 w-full animate-pulse rounded-md bg-surface-container-high" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-36 animate-pulse rounded-md bg-surface-container-high" />
          <div className="h-9 w-36 animate-pulse rounded-md bg-surface-container-high" />
        </div>
        <div className="mt-4 min-h-[220px] space-y-2 rounded-lg border border-outline/15 p-4">
          <div className="h-8 w-full animate-pulse rounded bg-surface-container-high" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-container-high" />
          ))}
        </div>
      </section>
    </div>
  )
}
