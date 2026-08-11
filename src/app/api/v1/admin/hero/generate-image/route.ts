import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { HeroSectionService } from '@/services/hero-section.service'

const BodySchema = z.object({
  fabric_id: z.number().int().positive()
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    const result = await HeroSectionService.enqueueHeroImageGeneration(body.fabric_id)
    return apiSuccess({ fabric_id: body.fabric_id, ...result })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
