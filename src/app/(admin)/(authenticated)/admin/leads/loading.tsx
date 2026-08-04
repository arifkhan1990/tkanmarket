export default function AdminLeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-surface-container-high" />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-container-high" />
        </div>
        <div className="h-10 w-48 animate-pulse rounded-full border border-outline/15 bg-surface-container-lowest" />
      </div>

      <div className="grid gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-outline/15 bg-surface-container-lowest p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-surface-container-high" />
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="h-24 animate-pulse rounded-xl bg-surface-container-high" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
