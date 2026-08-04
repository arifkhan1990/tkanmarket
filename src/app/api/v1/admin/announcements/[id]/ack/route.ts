import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { ValidationError } from '@/lib/errors'
import { AdminAnnouncementsService } from '@/services/admin-announcements.service'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const uid = session.user?.id ? parseInt(session.user.id, 10) : NaN
    if (!Number.isFinite(uid)) {
      return toApiErrorResponse(new ValidationError('Invalid session'))
    }
    const { id } = await ctx.params
    const announcementId = parseInt(id, 10)
    if (!Number.isFinite(announcementId)) {
      return toApiErrorResponse(new ValidationError('Invalid announcement id'))
    }
    await AdminAnnouncementsService.acknowledge(uid, announcementId)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
