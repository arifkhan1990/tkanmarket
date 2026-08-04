'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'

export interface SocialAnalyticsSummaryEntry {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'
  publishedCount: number
  totalReach: number
  totalImpressions: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalSaves: number
  totalLinkClicks: number
  totalVideoViews: number
}

export function useAdminSocialAnalyticsSummary(params: {
  platform?: string
  campaignId?: number
  since?: string
  until?: string
} = {}) {
  return useQuery<ApiEnvelope<{ summary: SocialAnalyticsSummaryEntry[] }>>({
    queryKey: ['admin-social-analytics-summary', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params.platform) sp.set('platform', params.platform)
      if (params.campaignId !== undefined) sp.set('campaign_id', String(params.campaignId))
      if (params.since) sp.set('since', params.since)
      if (params.until) sp.set('until', params.until)
      const res = await fetch(`/api/v1/admin/social/analytics/summary?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{ summary: SocialAnalyticsSummaryEntry[] }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Analytics request failed'
        throw new Error(message)
      }
      return json
    }
  })
}
