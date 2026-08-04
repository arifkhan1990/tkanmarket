import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminAlertsHubOverviewService } from '@/services/admin-alerts-hub-overview.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('Invalid session user id')
    }

    const data = await AdminAlertsHubOverviewService.getOverview({ userId })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
