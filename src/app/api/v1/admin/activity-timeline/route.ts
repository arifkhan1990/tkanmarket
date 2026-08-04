import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AdminActivityTimelineService } from '@/services/admin-activity-timeline.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional().nullable(),
  from: z.string().trim().optional().nullable(),
  to: z.string().trim().optional().nullable(),
  q: z.string().trim().min(1).max(200).optional().nullable()
})

function parseDateOrUndefined(input: string | null | undefined): Date | undefined {
  if (!input) return undefined
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)

    const parsed = QuerySchema.parse({
      userId: url.searchParams.get('userId'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      q: url.searchParams.get('q')
    })

    const data = await AdminActivityTimelineService.list({
      page,
      limit,
      userId: parsed.userId ?? undefined,
      from: parseDateOrUndefined(parsed.from ?? undefined),
      to: parseDateOrUndefined(parsed.to ?? undefined),
      q: parsed.q ?? undefined
    })

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

