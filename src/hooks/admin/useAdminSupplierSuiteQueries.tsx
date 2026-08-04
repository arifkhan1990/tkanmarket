'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  SupplierInsightsManagementKpis,
  SupplierOnboardingResponse,
  SupplierPerformanceMatrixResponse,
  SupplierPayoutsResponse,
  SupplierScorecardResponse
} from '@/types/supplier-insights.types'

async function parse<T>(res: Response): Promise<{ data: T; meta?: PaginationMeta }> {
  const json = (await res.json()) as ApiEnvelope<T> & { meta?: PaginationMeta }
  if (!res.ok || !json.success) {
    const msg = !json.success ? json.error.message : 'Request failed'
    throw new Error(msg)
  }
  return { data: json.data, meta: json.meta }
}

export function useAdminSupplierInsightsQuery() {
  return useQuery({
    queryKey: ['admin-supplier-insights'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/insights')
      const { data } = await parse<SupplierInsightsManagementKpis>(res)
      return data
    },
    staleTime: 60 * 1000
  })
}

export function useAdminSupplierPerformanceMatrixQuery() {
  return useQuery({
    queryKey: ['admin-supplier-performance-matrix'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/performance-matrix')
      const { data } = await parse<SupplierPerformanceMatrixResponse>(res)
      return data
    },
    staleTime: 60 * 1000
  })
}

export function useAdminSupplierScorecardQuery(variant: 'executive' | 'benchmark') {
  return useQuery({
    queryKey: ['admin-supplier-scorecard', variant],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('variant', variant)
      const res = await fetch(`/api/v1/admin/suppliers/scorecard?${sp.toString()}`)
      const { data } = await parse<SupplierScorecardResponse>(res)
      return data
    },
    staleTime: 60 * 1000
  })
}

/** Bulk order settlement rows (not `supplier_payout_requests` withdrawals). */
export function useAdminSupplierBulkOrderPayoutsQuery(params: { page: number; limit: number; q: string }) {
  return useQuery({
    queryKey: ['admin-supplier-bulk-order-payouts', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q.trim()) sp.set('q', params.q.trim())
      const res = await fetch(`/api/v1/admin/suppliers/payouts?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{
        summary: SupplierPayoutsResponse['summary']
        items: SupplierPayoutsResponse['items']
      }> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : 'Request failed')
      }
      return { summary: json.data.summary, items: json.data.items, meta: json.meta }
    },
    staleTime: 30 * 1000
  })
}

export function useAdminSupplierOnboardingQuery() {
  return useQuery({
    queryKey: ['admin-supplier-onboarding'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/onboarding')
      const { data } = await parse<SupplierOnboardingResponse>(res)
      return data
    },
    staleTime: 60 * 1000
  })
}
