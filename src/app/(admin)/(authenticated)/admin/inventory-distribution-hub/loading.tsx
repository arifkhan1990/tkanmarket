export default function InventoryDistributionHubLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="space-y-2">
        <div className="h-9 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-3xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-[min(56vh,420px)] animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high lg:col-span-8" />
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="h-72 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-lowest" />
          <div className="h-56 animate-pulse rounded-2xl bg-surface-container-high" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-lowest" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high" />
    </div>
  )
}
