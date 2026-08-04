import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'
import type { MarketplaceAnalyticsPeriod } from '@/types/marketplace-analytics.types'

export async function fetchMarketplaceAnalytics(
  period: MarketplaceAnalyticsPeriod
): Promise<ApiEnvelope<AdvancedAnalyticsResponse>> {
  const sp = new URLSearchParams()
  sp.set('period', period)
  const res = await fetch(`/api/v1/admin/marketplace-analytics?${sp.toString()}`)
  return (await res.json()) as ApiEnvelope<AdvancedAnalyticsResponse>
}
