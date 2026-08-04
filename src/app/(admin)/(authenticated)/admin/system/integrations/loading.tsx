export default function AdminSystemIntegrationsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-10 w-64 max-w-full animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-3xl bg-surface-container-lowest" />
        ))}
        <div className="h-56 animate-pulse rounded-3xl bg-primary/20 md:col-span-2 lg:col-span-2" />
      </div>
      <div className="space-y-3">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface-container-high" />
        <div className="overflow-hidden rounded-2xl border border-outline/10">
          <div className="h-11 animate-pulse bg-surface-container-high/80" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 border-t border-outline/10 animate-pulse bg-surface-container-low/50" />
          ))}
        </div>
      </div>
    </div>
  )
}
