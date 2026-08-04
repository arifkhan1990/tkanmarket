export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`row1-${idx}`} className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-container-high" />
              <div className="h-6 w-14 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
              <div className="h-7 w-20 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`row2-${idx}`} className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-container-high" />
              <div className="h-6 w-14 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
              <div className="h-7 w-20 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`row3-${idx}`} className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-container-high" />
              <div className="h-6 w-14 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
              <div className="h-7 w-20 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 space-y-2">
            <div className="h-4 w-56 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-40 animate-pulse rounded bg-surface-container-high" />
          </div>
          <div className="h-[280px] animate-pulse rounded-lg bg-surface-container-high" />
        </div>

        <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 space-y-2">
            <div className="h-4 w-56 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-40 animate-pulse rounded bg-surface-container-high" />
          </div>
          <div className="h-[280px] animate-pulse rounded-lg bg-surface-container-high" />
        </div>
      </div>

      <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-4 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
          <div className="h-3 w-44 animate-pulse rounded bg-surface-container-high" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={`activity-${idx}`} className="flex items-start gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-container-high" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container-high" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
