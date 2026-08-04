import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { FabricService } from '@/services/fabric.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PAGINATION } from '@/constants'

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 20, windowSeconds: 3600, routeKey: 'public:fabrics:featured' })
    const url = new URL(req.url)
    const limit =
      z.coerce
        .number()
        .int()
        .min(1)
        .max(PAGINATION.MAX_PAGE_SIZE)
        .optional()
        .parse(url.searchParams.get('limit') ?? undefined) ?? 8
    const rows = await FabricService.getFeatured(limit)
    return apiSuccess(rows)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

