import { FabricCardSkeleton } from '@/components/common/LoadingSkeleton/FabricCardSkeleton'

export { useRelatedFabrics } from './useFabricQuery'

export function RelatedFabricsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <FabricCardSkeleton key={idx} />
      ))}
    </div>
  )
}

