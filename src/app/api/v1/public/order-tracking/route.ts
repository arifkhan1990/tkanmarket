import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PublicOrderTrackingService } from '@/services/public-order-tracking.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  ref: z.string().trim().min(3).max(64)
})

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 30, windowSeconds: 3600, routeKey: 'public:order-tracking' })
    const parsed = querySchema.parse({ ref: req.nextUrl.searchParams.get('ref') ?? '' })
    const data = await PublicOrderTrackingService.getByOrderReference(parsed.ref)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
