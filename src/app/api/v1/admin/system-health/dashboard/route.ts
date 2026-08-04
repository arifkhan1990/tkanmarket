import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminSystemHealthDashboardService } from '@/services/admin-system-health-dashboard.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  range: z.enum(['1H', '24H', '7D']).optional().default('24H'),
  level: z.enum(['ALL', 'ERRORS', 'WARNINGS']).optional().default('ALL')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const params = QuerySchema.parse({
      range: url.searchParams.get('range') ?? undefined,
      level: url.searchParams.get('level') ?? undefined
    })

    const data = await AdminSystemHealthDashboardService.get({
      range: params.range,
      level: params.level
    })

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
