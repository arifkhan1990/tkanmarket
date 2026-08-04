export default function CustomReportBuilderLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-surface-container-highest" />
      <div className="h-4 max-w-xl animate-pulse rounded bg-surface-container-highest" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-container-highest" />
          ))}
        </div>
        <div className="lg:col-span-8">
          <div className="h-[520px] animate-pulse rounded-3xl bg-surface-container-highest" />
        </div>
      </div>
    </div>
  )
}
