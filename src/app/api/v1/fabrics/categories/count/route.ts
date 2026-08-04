import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { FabricService } from '@/services/fabric.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 15, windowSeconds: 3600, routeKey: 'public:fabrics:categories' })
    const rows = await FabricService.getCategoryCounts()
    return apiSuccess(rows)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

