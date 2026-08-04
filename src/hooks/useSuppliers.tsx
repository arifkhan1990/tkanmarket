'use client'
import * as React from 'react'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { SupplierSummary } from '@/types/marketplace.types'

export function useSuppliers(params: {
  page: number
  limit: number
  q?: string
  fabricType?: string
}) {
  const query = useQuery<ApiEnvelope<SupplierSummary[]>>({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q) sp.set('q', params.q)
      if (params.fabricType) sp.set('fabric_type', params.fabricType)

      const res = await fetch(`/api/v1/suppliers?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<SupplierSummary[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load suppliers')
  }, [query.error])

  return query
}

export function SuppliersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(25,28,30,0.04)] animate-pulse dark:shadow-none"
        >
          <div className="aspect-[16/10] bg-surface-container-high" />
          <div className="space-y-6 p-8">
            <div className="flex gap-4">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-surface-container-high" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 w-3/4 rounded-lg bg-surface-container-high" />
                <div className="h-4 w-1/2 rounded-lg bg-surface-container-high/80" />
              </div>
            </div>
            <div className="flex justify-between border-t border-outline/10 pt-6">
              <div className="h-3 w-28 rounded bg-surface-container-high/80" />
              <div className="h-4 w-24 rounded bg-surface-container-high/80" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SuppliersPageSkeleton() {
  return (
    <>
      <div className="mb-12 grid grid-cols-1 gap-10 lg:mb-16 lg:grid-cols-2 lg:items-end lg:gap-12">
        <div className="space-y-6">
          <div className="h-7 w-36 animate-pulse rounded-full bg-secondary-container/40" />
          <div className="space-y-3">
            <div className="h-12 w-full max-w-lg animate-pulse rounded-xl bg-surface-container-high md:h-14" />
            <div className="h-12 w-4/5 max-w-md animate-pulse rounded-xl bg-surface-container-high/90 md:h-14 lg:hidden" />
          </div>
        </div>
        <div className="hidden space-y-3 pb-2 lg:block">
          <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-surface-container-high/70" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded-lg bg-surface-container-high/60" />
          <div className="h-4 w-2/3 max-w-md animate-pulse rounded-lg bg-surface-container-high/50" />
        </div>
      </div>
      <div className="mb-12 space-y-8 lg:mb-16">
        <div className="h-14 max-w-2xl animate-pulse rounded-xl bg-surface-container-highest" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-[7.5rem] animate-pulse rounded-full bg-surface-container-high"
            />
          ))}
        </div>
      </div>
      <SuppliersSkeleton />
    </>
  )
}

/** Up to four consecutive page numbers, aligned with the current page when possible. */
export function visibleSupplierPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 0) return []
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const start = Math.min(Math.max(1, page - 1), totalPages - 3)
  return [start, start + 1, start + 2, start + 3]
}
