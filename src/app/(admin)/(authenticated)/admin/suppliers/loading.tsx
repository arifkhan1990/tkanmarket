export default function AdminSuppliersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-container-high sm:h-9 sm:w-64" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-surface-container-high" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded-xl bg-surface-container-high" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-surface-container-high" />
        </div>
      </div>
      <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-surface-container-high" />
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-low/50 p-2 dark:border-outline/15">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-xl bg-surface-container-high" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
        <div className="h-12 animate-pulse bg-surface-container-high" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse border-t border-outline/10 bg-surface-container-lowest/50" />
        ))}
      </div>
    </div>
  )
}
