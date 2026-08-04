import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { FabricTranslationService } from '@/services/translation.service'
import { addTranslationJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { isNull } from 'drizzle-orm'

const TranslateBodySchema = z.object({
  fabricId: z.coerce.number().int().positive().optional(),
  backfill: z.boolean().optional()
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = TranslateBodySchema.parse(await req.json().catch(() => ({})))

    if (body.fabricId) {
      const result = await FabricTranslationService.ensureBilingual(body.fabricId)
      if (!result) {
        return apiSuccess({ fabricId: body.fabricId, message: 'Already bilingual, no translation needed' })
      }
      return apiSuccess({
        fabricId: result.fabricId,
        translatedFields: result.translatedFields,
        sourceLang: result.sourceLang
      })
    }

    if (body.backfill) {
      const db = getDb()
      const allFabrics = await db
        .select({ id: fabrics.id })
        .from(fabrics)
        .where(isNull(fabrics.deletedAt))

      const ids = allFabrics.map((f) => f.id)
      logger.info('Backfill translation starting', { count: ids.length })

      await Promise.allSettled(
        ids.map((id) => addTranslationJob(id).catch((e) => {
          logger.warn('Backfill enqueue failed', { fabricId: id, message: (e as Error).message })
        }))
      )

      return apiSuccess({
        message: `Enqueued ${ids.length} translation jobs`,
        total: ids.length
      })
    }

    return toApiErrorResponse(new Error('Provide fabricId or backfill: true'))
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
