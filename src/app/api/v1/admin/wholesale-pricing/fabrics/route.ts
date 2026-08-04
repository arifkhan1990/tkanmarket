import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { WholesalePricingAdminService } from '@/services/wholesale-pricing-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  supplierId: z.coerce.number().int().positive().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const { page, limit } = parsePaginationParams(req.nextUrl.searchParams)
    const q = QuerySchema.parse({
      q: req.nextUrl.searchParams.get('q') ?? undefined,
      supplierId: req.nextUrl.searchParams.get('supplierId') ?? undefined
    })

    const { items, total } = await WholesalePricingAdminService.listFabrics({
      page,
      limit,
      q: q.q,
      supplierId: q.supplierId
    })

    const paginated = withPagination(items, total, page, limit)
    return apiSuccess({ items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
