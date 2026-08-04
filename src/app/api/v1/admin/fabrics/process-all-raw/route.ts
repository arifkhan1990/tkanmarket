import type { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { addAIJob } from '@/lib/queue/helpers'

export async function POST(_req: NextRequest) {
  try {
    await requireAdminSession()
    const db = getDb()
    const rows = await db.select({ id: fabrics.id }).from(fabrics).where(eq(fabrics.status, 'raw_scraped'))
    const ids = rows.map((r) => r.id)
    if (ids.length === 0) return apiSuccess({ succeeded: 0, failed: 0, total: 0 })
    const results = await Promise.allSettled(ids.map((id) => addAIJob(id)))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    return apiSuccess({ succeeded, failed, total: ids.length })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
