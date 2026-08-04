export default function HelpSupportLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-16">
      <div className="space-y-4">
        <div className="h-12 max-w-xl animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-24 max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-14 max-w-3xl animate-pulse rounded-xl bg-surface-container-high" />
      </div>
      <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-72 rounded-xl bg-surface-container-high md:col-span-2" />
        <div className="h-72 rounded-xl bg-surface-container-high" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-surface-container-high" />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-surface-container-high" />
      </div>
    </div>
  )
}
