import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCrawlerJobDetailLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-64" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <Skeleton className="min-h-[320px] rounded-2xl lg:col-span-8" />
        <div className="space-y-4 lg:col-span-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
