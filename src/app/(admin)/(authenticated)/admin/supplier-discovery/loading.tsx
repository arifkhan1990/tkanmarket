export default function AdminSupplierDiscoveryLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="space-y-2">
        <div className="h-9 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-3xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="animate-pulse rounded-xl border border-outline/15 bg-surface/40 p-6">
        <div className="h-5 w-40 rounded bg-surface-container-high" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-24 rounded-lg bg-surface-container-high md:col-span-2" />
          <div className="h-24 rounded-lg bg-surface-container-high" />
          <div className="h-10 rounded-lg bg-surface-container-high" />
          <div className="h-10 rounded-lg bg-surface-container-high" />
        </div>
        <div className="mt-4 h-10 w-36 rounded-lg bg-surface-container-highest/90" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-surface-container-high" />
        <div className="min-h-[200px] animate-pulse rounded-lg border border-outline/15 bg-surface-container-lowest">
          <div className="space-y-0 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-3 h-12 rounded-lg bg-surface-container-high" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
