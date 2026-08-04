export type ProductReviewStatusFilter = 'pending' | 'processing' | 'all'

/** Pipeline totals (single request: parallel indexed count queries, not N+1). */
export interface ProductReviewQueueCounts {
  readyForReview: number
  aiProcessing: number
  pipelineTotal: number
}

export interface ProductReviewQueueRow {
  id: number
  title: string
  sku: string | null
  status: string
  supplierName: string | null
  updatedAt: string
  primaryImage: string | null
}

export interface ProductReviewQueueResponse {
  items: ProductReviewQueueRow[]
  meta: { page: number; limit: number; total: number; totalPages: number }
  counts: ProductReviewQueueCounts
}
