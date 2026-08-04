import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminDashboardService } from '@/services/admin/dashboard.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminDashboardService.getDashboard()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

