export default function InventoryHealthDistributionLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
      <div className="space-y-2">
        <div className="h-10 max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-h-[280px] animate-pulse rounded-xl border border-outline/10 bg-surface-container-high" />
        <div className="min-h-[280px] animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
      </div>
      <div className="overflow-hidden rounded-xl border border-outline/10">
        <div className="h-24 animate-pulse bg-surface-container-low" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse border-t border-outline/5 bg-surface-container-lowest/80"
          />
        ))}
      </div>
    </div>
  )
}
