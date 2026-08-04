import { Skeleton } from '@/components/ui/skeleton'

export function NotificationCenterSkeleton({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-3xl space-y-4'}>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-outline/15 bg-surface-container-lowest p-6">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 max-w-sm" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
