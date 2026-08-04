import { FabricCardSkeleton } from '@/components/common/LoadingSkeleton/FabricCardSkeleton'
import { useFabrics } from './useFabricQuery'

export { useFabrics }

export function FabricsLoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <FabricCardSkeleton key={idx} />
      ))}
    </div>
  )
}


