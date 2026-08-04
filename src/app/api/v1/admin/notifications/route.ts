import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { withPagination } from '@/lib/utils/api-response'
import { AdminNotificationsService } from '@/services/admin-notifications.service'
import type { AdminNotificationCategoryFilter } from '@/types/admin-notifications.types'

export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
  category: z.enum(['all', 'system', 'leads', 'social']).default('all')
})

const patchSchema = z.union([
  z.object({
    ids: z.array(z.number().int().positive()).min(1)
  }),
  z.object({
    markAllRead: z.literal(true),
    category: z.enum(['all', 'system', 'leads', 'social']).optional()
  })
])

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const parsed = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { items, total } = await AdminNotificationsService.list({
      userId,
      page: parsed.page,
      limit: parsed.limit,
      category: parsed.category as AdminNotificationCategoryFilter
    })

    const paginated = withPagination(items, total, parsed.page, parsed.limit)
    return apiSuccess({ items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = patchSchema.parse(json)

    if ('ids' in body) {
      const n = await AdminNotificationsService.markRead({ userId, ids: body.ids })
      return apiSuccess({ updated: n })
    }

    const category = (body.category ?? 'all') as AdminNotificationCategoryFilter
    const n = await AdminNotificationsService.markAllRead({ userId, category })
    return apiSuccess({ updated: n })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
