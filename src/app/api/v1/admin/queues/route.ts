import type { NextRequest } from 'next/server'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { getQueueStats } from '@/lib/queue/helpers'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await getQueueStats()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

