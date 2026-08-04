import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { FabricCompareIdsSchema } from '@/lib/validations/fabric-compare.validation'
import { FabricService } from '@/services/fabric.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

const QuerySchema = z.object({
  ids: FabricCompareIdsSchema
})

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 60, windowSeconds: 3600, routeKey: 'public:fabrics:compare' })
    const raw = req.nextUrl.searchParams.get('ids') ?? ''
    const { ids } = QuerySchema.parse({ ids: raw })
    const items = await FabricService.getByIdsForCompare(ids)
    return apiSuccess(items)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
