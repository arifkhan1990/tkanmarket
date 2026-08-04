import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { SupplierInsightsService } from '@/services/supplier-insights.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().max(200).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const parsed = querySchema.parse({ q: url.searchParams.get('q') })

    const result = await SupplierInsightsService.getPayouts({
      page,
      limit,
      q: parsed.q
    })

    const paginated = withPagination(result.items, result.total, page, limit)
    return apiSuccess({ summary: result.summary, items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
