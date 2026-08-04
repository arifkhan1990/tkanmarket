import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AdminInventoryFabricsListService } from '@/services/admin-inventory-fabrics-list.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().max(200).optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const { page, limit } = parsePaginationParams(req.nextUrl.searchParams)
    const q = querySchema.parse({
      q: req.nextUrl.searchParams.get('q') ?? undefined
    }).q

    const { items, total } = await AdminInventoryFabricsListService.list({ page, limit, q })
    const paginated = withPagination(items, total, page, limit)
    return apiSuccess({ items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
