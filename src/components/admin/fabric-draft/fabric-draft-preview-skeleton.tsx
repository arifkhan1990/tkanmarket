export function FabricDraftPreviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-container-highest" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-surface-container-highest" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-full bg-surface-container-highest" />
      </div>
      <div className="h-10 max-w-md animate-pulse rounded-lg bg-surface-container-highest" />
      <div className="flex h-[min(760px,88vh)] flex-col gap-4 overflow-hidden rounded-[1.5rem] border border-outline/15 bg-surface-container-low lg:flex-row">
        <div className="h-64 w-full shrink-0 animate-pulse bg-surface-container-highest lg:h-auto lg:w-80" />
        <div className="flex-1 animate-pulse bg-surface-container-high" />
      </div>
    </div>
  )
}
