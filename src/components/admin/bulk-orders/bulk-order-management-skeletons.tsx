import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'

export function BulkOrderMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BulkOrderTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm">
      <div className="h-12 animate-pulse bg-surface-container-high" />
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-16 border-t border-outline/10 animate-pulse bg-surface-container-lowest" />
      ))}
    </div>
  )
}
