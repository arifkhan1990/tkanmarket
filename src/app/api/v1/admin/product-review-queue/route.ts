import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminProductReviewQueueService } from '@/services/admin-product-review-queue.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  filter: z.enum(['pending', 'processing', 'all']).optional().default('pending')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      filter: url.searchParams.get('filter') ?? undefined
    })

    const data = await AdminProductReviewQueueService.list({
      page: parsed.page,
      limit: parsed.limit,
      filter: parsed.filter
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
