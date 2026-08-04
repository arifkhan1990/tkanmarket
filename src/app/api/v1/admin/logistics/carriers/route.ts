import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminLogisticsCarriersService } from '@/services/admin-logistics-carriers.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  region: z.string().trim().min(1).optional(),
  serviceType: z.enum(['EXPRESS', 'ECONOMY', 'FREIGHT']).optional(),
  health: z.enum(['OPERATIONAL', 'DELAYED', 'MAINTENANCE']).optional(),
  q: z.string().trim().min(1).optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { data, total } = await AdminLogisticsCarriersService.listOverview({
      page: parsed.page,
      limit: parsed.limit,
      region: parsed.region,
      serviceType: parsed.serviceType,
      health: parsed.health,
      q: parsed.q
    })

    const paginated = withPagination(data.items, total, parsed.page, parsed.limit)
    return apiSuccess({ stats: data.stats, items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

