import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminAdvancedAnalyticsService } from '@/services/admin-advanced-analytics.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const _ = QuerySchema.parse({ q: url.searchParams.get('q') })

    const data = await AdminAdvancedAnalyticsService.getLast30Days()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

