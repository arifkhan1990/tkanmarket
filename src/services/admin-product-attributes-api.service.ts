import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { ProductAttributesOverviewResponse } from '@/types/admin-product-attributes.types'

export async function fetchProductAttributesOverview(): Promise<ApiEnvelope<ProductAttributesOverviewResponse>> {
  const res = await fetch('/api/v1/admin/product-attributes')
  return (await res.json()) as ApiEnvelope<ProductAttributesOverviewResponse>
}
