export default function AdminLeadDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-surface-container-high" />
          <div className="h-4 w-56 animate-pulse rounded bg-surface-container-high" />
        </div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-surface-container-high" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-14 animate-pulse rounded bg-surface-container-high" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-5">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="h-16 animate-pulse rounded bg-surface-container-high" />
              <div className="h-16 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-5">
            <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded bg-surface-container-high" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 h-32 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-3 h-10 w-28 animate-pulse rounded bg-surface-container-high" />
          </div>
        </div>
      </div>
    </div>
  )
}
