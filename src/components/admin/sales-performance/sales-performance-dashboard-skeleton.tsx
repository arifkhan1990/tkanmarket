import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SalesPerformanceDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-container-high" />
          <div className="h-5 w-full max-w-xl animate-pulse rounded-md bg-surface-container-high" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 animate-pulse rounded-full bg-surface-container-high" />
          <div className="h-10 w-24 animate-pulse rounded-full bg-surface-container-high" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-surface-container-high" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border border-outline/10 bg-surface-container-high/80" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-[420px] animate-pulse rounded-xl border border-outline/10 bg-surface-container-high/80 lg:col-span-2" />
        <div className="h-[420px] animate-pulse rounded-xl border border-outline/10 bg-surface-container-high/80" />
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-outline/10 bg-surface-container-high/80" />
      <div className="h-96 animate-pulse rounded-xl border border-outline/10 bg-surface-container-high/80" />
    </div>
  )
}

export function SalesPerformanceErrorPanel(props: { message: string; onRetry: () => void; disabled: boolean; refreshLabel: string }) {
  const { message, onRetry, disabled, refreshLabel } = props
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-outline/15 bg-surface-container-lowest px-6 py-16 text-center shadow-sm'
      )}
      role="alert"
    >
      <p className="max-w-md text-sm text-destructive">{message}</p>
      <Button type="button" variant="outline" className="rounded-full" onClick={() => void onRetry()} disabled={disabled}>
        {refreshLabel}
      </Button>
    </div>
  )
}
