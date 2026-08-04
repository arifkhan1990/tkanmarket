'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function Bar() {
  return <div className="h-3 w-full animate-pulse rounded-full bg-surface-container-high" />
}

export function PromotionAnalyticsSkeleton({
  className,
  'aria-label': ariaLabel
}: {
  className?: string
  'aria-label'?: string
}) {
  return (
    <div role="status" aria-busy="true" aria-label={ariaLabel} className={cn('space-y-8', className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-container-high" />
            </div>
            <div className="mt-3 h-9 w-20 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-surface-container-high" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 animate-pulse rounded bg-surface-container-high" />
              <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
              <div className="h-8 w-16 animate-pulse rounded-md bg-surface-container-high" />
              <div className="h-8 w-16 animate-pulse rounded-md bg-surface-container-high" />
            </div>
          </div>
          <div className="flex h-[240px] items-end justify-between gap-1 px-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex w-[8%] max-w-[40px] flex-1 flex-col items-center gap-2">
                <div className="relative h-[180px] w-full rounded-t-md bg-primary/10">
                  <div
                    className="absolute bottom-0 left-0 right-0 animate-pulse rounded-t-md bg-primary/25"
                    style={{ height: `${30 + ((i * 7) % 55)}%` }}
                  />
                </div>
                <div className="h-2 w-6 animate-pulse rounded bg-surface-container-high" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-surface-container-high" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between gap-2">
                  <div className="h-4 flex-1 animate-pulse rounded bg-surface-container-high" />
                  <div className="h-4 w-8 animate-pulse rounded bg-surface-container-high" />
                </div>
                <Bar />
              </div>
            ))}
          </div>
          <div className="mt-6 h-4 w-32 animate-pulse rounded bg-surface-container-high" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-3 border-b border-outline/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="h-6 w-56 animate-pulse rounded bg-surface-container-high" />
          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-container-high" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <div className="h-3 w-16 animate-pulse rounded bg-surface-container-high" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, ri) => (
                <TableRow key={ri}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
                      <div className="h-3 w-16 animate-pulse rounded bg-surface-container-high" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 animate-pulse rounded-md bg-surface-container-high" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-4 w-12 animate-pulse rounded bg-surface-container-high" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-4 w-10 animate-pulse rounded bg-surface-container-high" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-4 w-8 animate-pulse rounded bg-surface-container-high" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-surface-container-high" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-surface-container-high md:h-auto md:min-h-[200px]" />
        <div className="grid gap-4">
          <div className="h-28 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high" />
          <div className="h-28 animate-pulse rounded-2xl border border-outline/10 bg-surface-container-high" />
        </div>
      </div>
    </div>
  )
}
