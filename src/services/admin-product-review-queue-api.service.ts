import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { ProductReviewQueueResponse, ProductReviewStatusFilter } from '@/types/admin-product-review-queue.types'

export async function fetchProductReviewQueue(params: {
  page: number
  limit: number
  filter: ProductReviewStatusFilter
}): Promise<ApiEnvelope<ProductReviewQueueResponse>> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  sp.set('filter', params.filter)
  const res = await fetch(`/api/v1/admin/product-review-queue?${sp.toString()}`)
  return (await res.json()) as ApiEnvelope<ProductReviewQueueResponse>
}
