import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PricingAnalysisResponse } from '@/types/admin-pricing-analysis.types'

export async function fetchAdminPricingAnalysis(): Promise<ApiEnvelope<PricingAnalysisResponse>> {
  const res = await fetch('/api/v1/admin/pricing-analysis')
  return (await res.json()) as ApiEnvelope<PricingAnalysisResponse>
}
