'use client'
import * as React from 'react'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierDetail } from '@/types/marketplace.types'

export function useSupplier(slug: string) {
  const query = useQuery({
    queryKey: ['supplier', slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/suppliers/${encodeURIComponent(slug)}`)
      const json = (await res.json()) as ApiEnvelope<SupplierDetail>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    enabled: Boolean(slug)
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load supplier')
  }, [query.error])

  return query
}

export function SupplierDetailSkeleton() {
  return (
    <div className="space-y-0">
      <div className="mt-5 h-[min(320px,52vh)] min-h-[200px] w-full animate-pulse bg-surface-container-low sm:mt-6 md:mt-8" />
      <div className="relative z-10 mx-auto -mt-20 w-full max-w-screen-2xl px-4 sm:px-6 md:-mt-24 lg:px-8">
        <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm dark:bg-card sm:p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="mx-auto h-32 w-32 shrink-0 animate-pulse rounded-xl bg-surface-container-low sm:mx-0" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="mx-auto h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-surface-container-low sm:mx-0" />
                <div className="h-4 w-full max-w-sm animate-pulse rounded bg-surface-container-low" />
              </div>
            </div>
            <div className="flex w-full gap-3 sm:flex-row">
              <div className="h-12 min-h-[3rem] flex-1 animate-pulse rounded-lg bg-surface-container-low" />
              <div className="h-12 min-h-[3rem] flex-1 animate-pulse rounded-lg bg-surface-container-low" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 grid w-full max-w-screen-2xl grid-cols-1 items-start gap-8 px-4 sm:px-6 md:mt-12 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="space-y-8 lg:col-span-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container-low" />
          <div className="h-24 w-full max-w-3xl animate-pulse rounded-xl bg-surface-container-low" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface-container-low" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-container-low" />
            ))}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-5 w-40 animate-pulse rounded bg-surface-container-low sm:ml-auto" />
          </div>
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-surface-container-low" />
          <div className="h-12 w-full max-w-md animate-pulse rounded-xl bg-surface-container-low" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[220px] animate-pulse rounded-2xl bg-surface-container-low" />
            ))}
          </div>
        </div>
        <div className="space-y-8 lg:col-span-4">
          <div className="h-72 animate-pulse rounded-xl bg-surface-container-low" />
          <div className="h-48 animate-pulse rounded-xl bg-surface-container-low" />
          <div className="h-56 animate-pulse rounded-xl bg-surface-container-low" />
        </div>
      </div>
    </div>
  )
}
