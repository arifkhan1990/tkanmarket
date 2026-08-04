import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { SupplierInsightsService } from '@/services/supplier-insights.service'

export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)

    const result = await SupplierInsightsService.getInquiries({
      supplierId: params.id,
      page,
      limit
    })

    const paginated = withPagination(result.items, result.total, page, limit)
    return apiSuccess(
      {
        supplier: result.supplier,
        pendingCount: result.pendingCount,
        items: paginated.items
      },
      paginated.meta
    )
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
