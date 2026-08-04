import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AuthSecurityEventService } from '@/services/auth-security-event.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  eventType: z.string().trim().min(1).max(120).optional().nullable(),
  from: z.string().trim().optional().nullable(),
  to: z.string().trim().optional().nullable(),
  q: z.string().trim().min(1).max(200).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const params = QuerySchema.extend({
      page: z.number().int().min(1),
      limit: z.number().int().min(1).max(100)
    }).parse({
      page,
      limit,
      eventType: url.searchParams.get('eventType'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      q: url.searchParams.get('q')
    })

    const data = await AuthSecurityEventService.list({
      page: params.page,
      limit: params.limit,
      eventType: params.eventType ?? undefined,
      from: params.from ?? undefined,
      to: params.to ?? undefined,
      q: params.q ?? undefined
    })

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
