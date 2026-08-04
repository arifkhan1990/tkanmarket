export default function InventoryHealthLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
      <div className="space-y-2">
        <div className="h-10 max-w-lg animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-2 h-52 animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
        <div className="h-52 animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
        <div className="h-52 animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 animate-pulse rounded-xl border border-outline/10 bg-surface-container-high" />
        <div className="h-80 animate-pulse rounded-xl border border-outline/10 bg-surface-container-lowest" />
      </div>
      <div className="overflow-hidden rounded-xl border border-outline/10">
        <div className="h-14 animate-pulse bg-surface-container-low" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse border-t border-outline/5 bg-surface-container-lowest/80"
          />
        ))}
      </div>
    </div>
  )
}
