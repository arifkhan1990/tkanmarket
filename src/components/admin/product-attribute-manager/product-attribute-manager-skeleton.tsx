'use client'

import { cn } from '@/lib/utils'

export function ProductAttributeManagerSkeleton({
  className,
  'aria-label': ariaLabel
}: {
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={cn('space-y-8', className)}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="rounded-xl bg-surface-container-low p-4 md:p-6">
            <div className="mb-4 h-3 w-32 animate-pulse rounded bg-surface-container-high" />
            <div className="max-h-[420px] space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-11 animate-pulse items-center justify-between rounded-xl bg-surface-container-high/80 px-3"
                >
                  <div className="h-3 w-2/3 rounded bg-surface-container-highest" />
                  <div className="h-5 w-10 rounded-full bg-surface-container-highest" />
                </div>
              ))}
            </div>
            <div className="mt-4 h-12 animate-pulse rounded-xl border border-dashed border-outline/20 bg-surface-container-high/50" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="h-7 w-64 max-w-full animate-pulse rounded bg-surface-container-high" />
                <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
              </div>
              <div className="h-9 w-36 animate-pulse rounded-lg bg-surface-container-high" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
                  <div className="h-12 animate-pulse rounded-xl bg-surface-container-high" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="h-64 animate-pulse rounded-3xl border border-outline/10 bg-surface-container-high xl:col-span-8" />
            <div className="h-64 animate-pulse rounded-3xl border border-outline/10 bg-surface-container-high xl:col-span-4" />
          </div>
          <div className="h-40 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-low" />
        </div>
      </div>
    </div>
  )
}
