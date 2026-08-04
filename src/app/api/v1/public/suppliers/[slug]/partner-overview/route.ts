import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { SupplierPartnerOverviewService } from '@/services/supplier-partner-overview.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await enforceRateLimit(req, { limit: 40, windowSeconds: 3600, routeKey: 'public:supplier-partner' })
    const slug = (await context.params).slug
    const data = await SupplierPartnerOverviewService.getBySlug(slug)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
