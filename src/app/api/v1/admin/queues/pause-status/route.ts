import type { NextRequest } from 'next/server'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { QueuePauseAdminService } from '@/services/admin/queue-pause-admin.service'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const queues = await QueuePauseAdminService.getPauseStates()
    return apiSuccess({ queues })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
