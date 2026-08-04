export function FabricCategoriesSkeleton() {
  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest overflow-hidden">
      <div className="px-4 py-3 border-b border-outline/10">
        <div className="h-9 w-full max-w-sm rounded-full bg-surface-container/60 animate-pulse" />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 h-4 rounded bg-surface-container/60 animate-pulse" />
              <div className="col-span-3 h-4 rounded bg-surface-container/60 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-surface-container/60 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-surface-container/60 animate-pulse" />
              <div className="col-span-2 h-8 rounded-full bg-surface-container/60 animate-pulse justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

