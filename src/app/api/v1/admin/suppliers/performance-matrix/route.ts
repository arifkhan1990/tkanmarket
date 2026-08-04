import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierInsightsService } from '@/services/supplier-insights.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await SupplierInsightsService.getPerformanceMatrix()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
