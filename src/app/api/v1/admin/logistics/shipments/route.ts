import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminLogisticsShipmentsService } from '@/services/admin-logistics-shipments.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(12),
  status: z.enum(['ALL', 'IN_TRANSIT', 'DELAYED', 'CUSTOMS_HOLD', 'DELIVERED']).optional().default('ALL')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { data, total } = await AdminLogisticsShipmentsService.list({
      page: parsed.page,
      limit: parsed.limit,
      status: parsed.status
    })

    const paginated = withPagination(data.items, total, parsed.page, parsed.limit)
    return apiSuccess({ overview: data.overview, items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
