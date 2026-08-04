import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PublicBulkInquiryMetricsService } from '@/services/public-bulk-inquiry-metrics.service'

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 30, windowSeconds: 3600, routeKey: 'public:bulk-inquiry:metrics' })
    const data = await PublicBulkInquiryMetricsService.get()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

