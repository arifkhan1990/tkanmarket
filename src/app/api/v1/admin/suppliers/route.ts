import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AdminSuppliersService } from '@/services/admin-suppliers.service'

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

    const { items, total } = await AdminSuppliersService.list({
      page,
      limit,
      q: parsed.q
    })

    const paginated = withPagination(items, total, page, limit)
    return apiSuccess(paginated.items, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
