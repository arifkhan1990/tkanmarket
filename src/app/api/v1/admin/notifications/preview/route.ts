import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminNotificationsService } from '@/services/admin-notifications.service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/admin/notifications/preview
 *
 * Returns the last 5 notifications plus the total unread count.
 * Designed for the navbar bell-dropdown — optimised to two concurrent SQL queries.
 *
 * Security: admin session required (ADMIN | SALES role).
 * Performance: 2 concurrent indexed queries, no per-row joins.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId) || userId <= 0) throw new Error('Invalid session')

    const preview = await AdminNotificationsService.getPreview({ userId })
    return apiSuccess(preview)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
