import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierReviewService } from '@/services/supplier-review.service'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']).optional(),
  supplier_id: z.coerce.number().int().positive().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      supplier_id: url.searchParams.get('supplier_id') ?? undefined
    })

    const result = await SupplierReviewService.list({
      page: parsed.page,
      limit: parsed.limit,
      status: parsed.status,
      supplierId: parsed.supplier_id
    })

    const paginated = withPagination(result.items, result.total, parsed.page, parsed.limit)
    return apiSuccess(
      { items: paginated.items, stats: result.stats },
      paginated.meta
    )
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
