export default function GlobalShippingLogisticsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      <div className="space-y-3">
        <div className="h-10 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[280px] animate-pulse rounded-3xl bg-surface-container-high lg:col-span-8 sm:h-[400px]" />
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="h-40 animate-pulse rounded-3xl bg-surface-container-high" />
          <div className="h-44 animate-pulse rounded-3xl bg-surface-container-high" />
        </div>
      </div>
      <div className="h-12 max-w-md animate-pulse rounded-2xl bg-surface-container-high" />
      <div className="overflow-hidden rounded-3xl border border-outline/10">
        <div className="h-14 animate-pulse bg-surface-container-low" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse border-t border-surface-container-low bg-surface-container-lowest/50" />
        ))}
      </div>
    </div>
  )
}
