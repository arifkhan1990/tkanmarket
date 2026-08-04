export function FabricTypesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 rounded-xl bg-surface-container/60 animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded bg-surface-container/60 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-full bg-surface-container/60 animate-pulse" />
          <div className="h-9 w-28 rounded-full bg-surface-container/60 animate-pulse" />
        </div>
      </div>

      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-outline/10 px-4 py-3">
          <div className="h-9 w-full max-w-sm rounded-full bg-surface-container/60 animate-pulse" />
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2 h-4 rounded bg-surface-container/60 animate-pulse" />
                <div className="col-span-3 h-4 rounded bg-surface-container/60 animate-pulse" />
                <div className="col-span-3 h-4 rounded bg-surface-container/60 animate-pulse" />
                <div className="col-span-1 h-4 rounded bg-surface-container/60 animate-pulse" />
                <div className="col-span-1 h-4 rounded bg-surface-container/60 animate-pulse" />
                <div className="col-span-1 h-6 w-16 rounded-full bg-surface-container/60 animate-pulse" />
                <div className="col-span-1 h-8 w-8 rounded-full bg-surface-container/60 animate-pulse justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
