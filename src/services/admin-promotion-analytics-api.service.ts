import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PromotionAnalyticsResponse } from '@/types/admin-promotion-analytics.types'

export async function fetchPromotionAnalytics(): Promise<ApiEnvelope<PromotionAnalyticsResponse>> {
  const res = await fetch('/api/v1/admin/promotion-analytics')
  return (await res.json()) as ApiEnvelope<PromotionAnalyticsResponse>
}
