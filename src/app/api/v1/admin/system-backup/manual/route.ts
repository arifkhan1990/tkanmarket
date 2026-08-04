import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession } from '@/lib/auth/require-admin'
import { getDb } from '@/db'
import { auditLog } from '@/db/schema/audit.schema'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  note: z.string().max(500).optional()
})

export async function POST(req: Request) {
  try {
    const session = await requireAdminOnlySession()
    const json = await req.json().catch(() => ({}))
    const parsed = BodySchema.parse(json)

    const actorId = session.user?.id ? Number.parseInt(session.user.id, 10) : NaN

    const db = getDb()
    await db.insert(auditLog).values({
      actorId: Number.isFinite(actorId) ? actorId : null,
      action: 'system.backup.manual_requested',
      entityType: 'system_backup',
      entityId: null,
      success: true,
      message: parsed.note ?? 'Manual backup coordination requested from admin console',
      payload: { source: 'admin_system_backup_recovery' },
      ip: null,
      userAgent: null
    })

    return apiSuccess({ ok: true }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
