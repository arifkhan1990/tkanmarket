import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { FabricTranslationService } from '@/services/translation.service'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)

    const result = await FabricTranslationService.ensureBilingual(params.id)
    if (!result) {
      return apiSuccess({ fabricId: params.id, message: 'Already bilingual, no translation needed' })
    }

    return apiSuccess({
      fabricId: result.fabricId,
      translatedFields: result.translatedFields,
      sourceLang: result.sourceLang
    }, undefined, 200)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
