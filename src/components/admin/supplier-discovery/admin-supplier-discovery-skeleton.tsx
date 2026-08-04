import { Skeleton } from '@/components/ui/skeleton'

export function AdminSupplierDiscoveryRunsSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-outline/15 p-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function AdminSupplierDiscoverySuppliersSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-outline/15 p-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
