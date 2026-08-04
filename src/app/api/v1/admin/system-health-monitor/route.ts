import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SystemHealthAdminService } from '@/services/system-health-admin.service'
import type { SystemHealthRange } from '@/types/system-health-monitor.types'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  range: z.enum(['1h', '24h', '7d']).optional().default('24h')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const params = QuerySchema.parse({
      range: url.searchParams.get('range') ?? undefined
    })

    const range = params.range as SystemHealthRange
    const data = await SystemHealthAdminService.getSystemHealth({ range, alertLimit: 15 })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

