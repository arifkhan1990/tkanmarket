import { FabricCardSkeleton } from '@/components/common/LoadingSkeleton/FabricCardSkeleton'

export { useFabric } from './useFabricQuery'

export function FabricDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <FabricCardSkeleton />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="aspect-square rounded-2xl bg-surface-container-low/50 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded-xl bg-surface-container-low/50 animate-pulse" />
        <div className="h-4 w-1/2 rounded-xl bg-surface-container-low/50 animate-pulse" />
        <div className="h-10 w-3/4 rounded-3xl bg-surface-container-low/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 rounded-2xl bg-surface-container-low/50 animate-pulse" />
          <div className="h-20 rounded-2xl bg-surface-container-low/50 animate-pulse" />
        </div>
        <div className="h-12 w-full rounded-2xl bg-surface-container-low/50 animate-pulse" />
      </div>
    </div>
  )
}


