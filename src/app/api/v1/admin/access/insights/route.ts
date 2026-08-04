import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminAccessInsightsService } from '@/services/admin-access-insights.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  // Reserved for future filters (e.g. lastNDays).
  // Keeping schema here avoids breaking changes later.
  _t: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    QuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams.entries()))
    const data = await AdminAccessInsightsService.getInsights()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

