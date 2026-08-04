import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminAdvancedAnalyticsService } from '@/services/admin-advanced-analytics.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  period: z.enum(['30d', 'quarter', 'ytd']).optional().default('30d')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      period: url.searchParams.get('period') ?? undefined
    })

    const data = await AdminAdvancedAnalyticsService.getForMarketplacePeriod(parsed.period)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
