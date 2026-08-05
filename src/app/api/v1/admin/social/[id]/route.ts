import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { NotFoundError, AuthError } from '@/lib/errors'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const PatchBodySchema = z.object({
  caption_text: z.string().max(8000).optional(),
  hashtags: z.array(z.string().max(120)).max(40).optional()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const row = await SocialAdminService.getById(params.id)
    if (!row) {
      throw new NotFoundError('Social post not found')
    }
    return apiSuccess(row)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const body = PatchBodySchema.parse(await req.json().catch(() => ({})))

    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')

    if (body.caption_text !== undefined) {
      await SocialAdminService.updateCaption(params.id, body.caption_text, userId)
    }
    if (body.hashtags !== undefined) {
      const cleaned = body.hashtags.map((h) => h.trim()).filter((h) => h.length > 0)
      await SocialAdminService.updateHashtags(params.id, cleaned, userId)
    }

    const row = await SocialAdminService.getById(params.id)
    if (!row) {
      throw new NotFoundError('Social post not found')
    }
    return apiSuccess(row)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
