import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { PublicStatsService } from '@/services/public-stats.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 30, windowSeconds: 3600, routeKey: 'public:stats' })
    const stats = await PublicStatsService.getPublicStats()
    return apiSuccess(stats)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

