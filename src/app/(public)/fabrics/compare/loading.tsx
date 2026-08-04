import {
  FabricCompareSkeleton,
  FabricCompareToolbarSkeleton
} from '@/components/marketplace/FabricCompareClient'
import { PublicPageShell } from '@/components/shared/public-page-shell'

export default function FabricCompareLoading() {
  return (
    <PublicPageShell
      className="min-h-[60vh] pb-12 pt-8 md:pb-16 md:pt-10"
      blur="sm"
      contentClassName="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-2" aria-hidden>
        <div className="h-4 w-12 animate-pulse rounded bg-surface-container-high sm:w-14" />
        <span className="text-on-surface-variant/35">/</span>
        <div className="h-4 w-16 animate-pulse rounded bg-surface-container-high sm:w-20" />
        <span className="text-on-surface-variant/35">/</span>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high sm:w-28" />
      </div>
      <FabricCompareToolbarSkeleton />
      <FabricCompareSkeleton count={4} />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[160px] animate-pulse rounded-3xl border border-outline/10 bg-surface-container-low p-8 shadow-sm"
          />
        ))}
      </div>
    </PublicPageShell>
  )
}
