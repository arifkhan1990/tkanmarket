import { Skeleton } from '@/components/ui/skeleton'

export function StatCardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-3.5 shadow-sm dark:border-outline/15 sm:p-4">
        <Skeleton className="pointer-events-none absolute -right-3 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-full max-w-[120px] rounded-full" />
            <Skeleton className="h-7 w-16 rounded-md sm:h-8 sm:w-20" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[128px] overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15 sm:min-h-[140px] sm:p-7">
      <Skeleton className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl sm:h-40 sm:w-40" />
      <div className="relative flex items-start justify-between gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
        <Skeleton className="hidden h-7 w-16 rounded-full sm:block" />
      </div>
      <div className="relative mt-6 space-y-2.5">
        <Skeleton className="h-3.5 w-28 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-xl sm:h-12 sm:w-40" />
      </div>
    </div>
  )
}

