import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { withPagination } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'
import type { SystemLogLevel } from '@/types/system-console.types'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  level: z.enum(['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).default('ALL'),
  service: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  includeAnalytics: z.coerce.boolean().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const sp = req.nextUrl.searchParams
    const raw = Object.fromEntries(sp.entries())
    const q = QuerySchema.parse(raw)
    const level = q.level === 'ALL' ? 'ALL' : (q.level as SystemLogLevel)
    const result = await SystemConsoleService.getTechnicalLogs({
      page: q.page,
      limit: q.limit,
      level,
      service: q.service,
      from: q.from,
      to: q.to,
      q: q.q
    })
    const paginated = withPagination(result.items, result.total, q.page, q.limit)
    const services = await SystemConsoleService.listDistinctLogServices()
    const hourlyBuckets = q.includeAnalytics ? await SystemConsoleService.getLogHourlyBuckets() : undefined
    return apiSuccess(
      {
        items: paginated.items,
        liveEventCount: result.liveEventCount,
        liveWindowMinutes: result.liveWindowMinutes,
        services,
        hourlyBuckets
      },
      paginated.meta
    )
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
