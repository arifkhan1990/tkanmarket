export function BulkDataOperationsSummarySkeleton() {
  return (
    <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-4 shadow-sm sm:p-5 dark:border-outline/15">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-2xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    </section>
  )
}

export function BulkDataOperationsHistorySkeleton() {
  return (
    <section className="mt-8 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <div className="mb-4 h-6 w-40 rounded bg-surface-container-high animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    </section>
  )
}
