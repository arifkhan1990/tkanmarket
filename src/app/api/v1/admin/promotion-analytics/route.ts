import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminPromotionAnalyticsService } from '@/services/admin-promotion-analytics.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminPromotionAnalyticsService.getWeeklySeries()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
