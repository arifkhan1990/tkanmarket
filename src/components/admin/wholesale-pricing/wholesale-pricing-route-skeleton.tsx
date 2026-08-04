import { Skeleton } from '@/components/ui/skeleton'

export function WholesalePricingRouteSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-2xl lg:col-span-4" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-8" />
      </div>
    </div>
  )
}
