'use client'
import * as React from 'react'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'

type CategoryCount = { category: string; count: number }

export function useCategoryCounts() {
  const query = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/fabrics/categories/count')
      const json = (await res.json()) as ApiEnvelope<CategoryCount[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load categories')
  }, [query.error])

  return query
}

export function CategoryCountsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="h-16 rounded-2xl bg-surface-container-low animate-pulse" />
      ))}
    </div>
  )
}

