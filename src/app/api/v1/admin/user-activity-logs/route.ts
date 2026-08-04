import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { UserActivityLogsService } from '@/services/user-activity-logs.service'
import type { UserActivityActionType } from '@/types/user-activity-logs.types'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional().nullable(),
  from: z.string().trim().optional().nullable(),
  to: z.string().trim().optional().nullable(),
  q: z.string().trim().min(1).max(200).optional().nullable(),
  actionType: z
    .enum(['ALL', 'FABRIC_APPROVAL', 'LEAD_ASSIGNED', 'USER_PERMISSIONS', 'SUPPLIER_VERIFICATION'])
    .optional()
    .nullable()
})

function parseDateOrDefault(input: string | null | undefined, fallback: Date): Date {
  if (!input) return fallback
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return fallback
  return d
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)

    const parsed = QuerySchema.parse({
      userId: url.searchParams.get('userId'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      q: url.searchParams.get('q')
    })

    const sessionUserId = Number(session.user.id)
    const resolvedUserId = parsed.userId ?? sessionUserId
    if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) throw new Error('Invalid user')

    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    let from = parseDateOrDefault(parsed.from ?? undefined, defaultFrom)
    let to = parseDateOrDefault(parsed.to ?? undefined, now)

    if (from.getTime() > to.getTime()) {
      const tmp = from
      from = to
      to = tmp
    }

    const data = await UserActivityLogsService.get({
      userId: resolvedUserId,
      page,
      limit,
      from,
      to,
      q: parsed.q ?? undefined,
      actionType: (parsed.actionType as UserActivityActionType | null | undefined) ?? undefined
    })

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

