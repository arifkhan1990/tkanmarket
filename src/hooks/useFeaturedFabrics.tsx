import { FabricCardSkeleton } from '@/components/common/LoadingSkeleton/FabricCardSkeleton'

export { useFeaturedFabrics } from './useFabricQuery'

export function FeaturedFabricsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <FabricCardSkeleton key={idx} />
      ))}
    </div>
  )
}

