'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  WholesalePricingFabricListItem,
  WholesalePricingProfileDto,
  WholesalePricingSimulatorParams,
  WholesalePricingTierRow
} from '@/types/wholesale-pricing.types'
import { useI18n } from '@/hooks/useI18n'

export function useWholesalePricingFabricList(params: {
  page: number
  limit: number
  q: string
  supplierId?: number
}) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-wholesale-pricing-fabrics', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q.trim()) sp.set('q', params.q.trim())
      if (params.supplierId) sp.set('supplierId', String(params.supplierId))
      const res = await fetch(`/api/v1/admin/wholesale-pricing/fabrics?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{ items: WholesalePricingFabricListItem[] }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return { items: json.data.items, meta: json.meta }
    },
    staleTime: 30 * 1000
  })
}

export function useWholesalePricingProfile(fabricId: number | null) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-wholesale-pricing-profile', fabricId],
    enabled: fabricId !== null && fabricId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabricId}/wholesale-pricing`)
      const json = (await res.json()) as ApiEnvelope<{
        profile: WholesalePricingProfileDto | null
        fabric: {
          id: number
          sku: string | null
          title: string
          price_usd: string | null
          moq: number | null
          images: string[] | null
        }
      }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    staleTime: 20 * 1000
  })
}

export function useWholesalePricingSaveMutation() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  return useMutation({
    mutationFn: async (params: {
      fabricId: number
      tiers: WholesalePricingTierRow[]
      simulator: WholesalePricingSimulatorParams | null
      recompute_from_simulator?: boolean
    }) => {
      const res = await fetch(`/api/v1/admin/fabrics/${params.fabricId}/wholesale-pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiers: params.tiers,
          simulator: params.simulator,
          recompute_from_simulator: params.recompute_from_simulator
        })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['admin-wholesale-pricing-profile', vars.fabricId] })
      await qc.invalidateQueries({ queryKey: ['admin-wholesale-pricing-fabrics'] })
      toast.success(messages.admin.wholesalePricing.savedToast)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : messages.admin.leadsTimeline.requestFailed)
    }
  })
}
