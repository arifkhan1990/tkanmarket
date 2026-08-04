import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierInsightsService } from '@/services/supplier-insights.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  variant: z.enum(['executive', 'benchmark']).optional().default('executive')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = querySchema.parse({ variant: url.searchParams.get('variant') ?? undefined })
    const data = await SupplierInsightsService.getScorecard(parsed.variant)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
