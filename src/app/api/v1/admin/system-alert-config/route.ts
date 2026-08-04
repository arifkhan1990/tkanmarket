import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SystemAlertConfigService } from '@/services/system-alert-config.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await SystemAlertConfigService.getBundle()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
