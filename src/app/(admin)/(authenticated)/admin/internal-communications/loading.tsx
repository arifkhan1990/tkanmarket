export default function InternalCommunicationsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <div className="space-y-2">
        <div className="h-9 max-w-sm animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-5 max-w-2xl animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="h-[min(420px,50vh)] animate-pulse rounded-2xl border border-outline/10 bg-surface-container-lowest" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-surface-container-high" />
            <div className="h-24 animate-pulse rounded-2xl bg-surface-container-high" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-7">
          <div className="h-10 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
          <div className="min-h-[280px] animate-pulse rounded-2xl border border-outline/10 bg-surface-container-lowest" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface-container-highest/90" />
        </div>
      </div>
    </div>
  )
}
