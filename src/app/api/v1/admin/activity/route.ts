import { desc, eq } from 'drizzle-orm'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { getDb } from '@/db'
import { leadActivityLog, leads } from '@/db/schema/leads.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import type { AdminActivityEvent } from '@/types/admin-activity.types'

export const dynamic = 'force-dynamic'

function buildMessage(eventType: string, companyName: string | null) {
  const t = eventType.toUpperCase()
  const company = companyName ? ` (${companyName})` : ''

  if (t === 'LEAD_CREATED') return `New lead created${company}`
  if (t === 'LEAD_STATUS_CHANGED') return `Lead status changed${company}`
  if (t === 'LEAD_ASSIGNED') return `Lead assigned${company}`
  if (t === 'NOTE_ADDED') return `Note added${company}`
  return `${eventType}${company}`
}

export async function GET() {
  try {
    await requireAdminSession()
    const db = getDb()

    const leadRows = await db
      .select({
        id: leadActivityLog.id,
        eventType: leadActivityLog.eventType,
        createdAt: leadActivityLog.createdAt,
        companyName: leads.companyName
      })
      .from(leadActivityLog)
      .leftJoin(leads, eq(leadActivityLog.leadId, leads.id))
      .orderBy(desc(leadActivityLog.id))
      .limit(20)

    const fabricRows = await db
      .select({
        id: fabricActivityLog.id,
        eventType: fabricActivityLog.eventType,
        createdAt: fabricActivityLog.createdAt,
        message: fabricActivityLog.message
      })
      .from(fabricActivityLog)
      .orderBy(desc(fabricActivityLog.id))
      .limit(20)

    const leadEvents: AdminActivityEvent[] = leadRows.map((r) => ({
      id: `lead:${r.id}`,
      event_type: r.eventType,
      message: buildMessage(r.eventType, r.companyName ?? null),
      created_at: r.createdAt.toISOString()
    }))

    const fabricEvents: AdminActivityEvent[] = fabricRows.map((r) => ({
      id: `fabric:${r.id}`,
      event_type: r.eventType,
      message: r.message,
      created_at: r.createdAt.toISOString()
    }))

    const data = [...leadEvents, ...fabricEvents]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      .slice(0, 10)

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

