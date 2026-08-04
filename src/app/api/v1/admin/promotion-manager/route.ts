import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminPromotionManagerService } from '@/services/admin-promotion-manager.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminPromotionManagerService.getOverview()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
