import { and, isNull, eq } from 'drizzle-orm'
import { count } from 'drizzle-orm'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import type { AdminSidebarBadges } from '@/types/admin-sidebar-badges.types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
    const db = getDb()

    const pendingReview = await db
      .select({ count: count() })
      .from(fabrics)
      .where(and(eq(fabrics.status, 'ai_processed'), isNull(fabrics.deletedAt)))

    const payload: AdminSidebarBadges = {
      fabricsPendingReview: pendingReview[0]?.count ?? 0
    }

    return apiSuccess(payload)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

