export default function CrawlerSectionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-9 w-48 max-w-full animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-surface-container-high/80" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 h-10 w-28 animate-pulse rounded-lg bg-surface-container-high" />
          </div>
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-[2rem] border border-outline/10 bg-surface-container-low/50" />
    </div>
  )
}
