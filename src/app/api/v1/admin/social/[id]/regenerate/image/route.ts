import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AuthError } from '@/lib/errors'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const BodySchema = z.object({
  prompt: z.string().trim().max(4000).nullish()
})

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const body = (await req.json().catch(() => null)) as { prompt?: string } | null
    const parsedBody = BodySchema.parse(body ?? {})
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const result = await SocialAdminService.regenerateImageConcept(params.id, userId, parsedBody.prompt)
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}