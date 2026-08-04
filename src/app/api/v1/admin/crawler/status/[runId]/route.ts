import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'

const ParamsSchema = z.object({
  runId: z.coerce.number().int().positive()
})

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

export async function GET(_req: NextRequest, context: { params: Promise<{ runId: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const db = getDb()
    const rows = await db.select().from(crawlerRuns).where(eq(crawlerRuns.id, params.runId)).limit(1)
    const r = rows[0]
    if (!r) return apiSuccess({ run: null })
    return apiSuccess({
      run: {
        id: r.id,
        status: r.status,
        source: r.source,
        keywords: r.keywords,
        productsFound: r.productsFound,
        productsSaved: r.productsSaved,
        errorsCount: r.errorsCount,
        startedAt: toIso(r.startedAt),
        completedAt: toIso(r.completedAt),
        errorLog: r.errorLog ?? null
      }
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

