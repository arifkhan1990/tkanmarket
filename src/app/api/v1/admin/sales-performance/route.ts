import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminSalesPerformanceService } from '@/services/admin-sales-performance.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).optional().default(30)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = querySchema.parse({
      days: req.nextUrl.searchParams.get('days') ?? undefined
    })
    const data = await AdminSalesPerformanceService.get({ days: parsed.days })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
