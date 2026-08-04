import { Skeleton } from '@/components/ui/skeleton'

export default function AdminBullJobDetailLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-72" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="min-h-[240px] rounded-2xl lg:col-span-7" />
        <Skeleton className="min-h-[320px] rounded-2xl lg:col-span-5" />
      </div>
    </div>
  )
}
