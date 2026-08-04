import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PromotionManagerResponse } from '@/types/admin-promotion-manager.types'

export async function fetchPromotionManagerOverview(): Promise<ApiEnvelope<PromotionManagerResponse>> {
  const res = await fetch('/api/v1/admin/promotion-manager')
  return (await res.json()) as ApiEnvelope<PromotionManagerResponse>
}
