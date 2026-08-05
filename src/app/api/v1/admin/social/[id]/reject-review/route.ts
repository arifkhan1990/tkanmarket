import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'
import { AuthError } from '@/lib/errors'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const RejectReasonEnum = z.enum([
  'WRONG_FABRIC',
  'WEAK_COPY',
  'MEDIA_BROKEN',
  'DUPLICATE',
  'OTHER'
])

const BodySchema = z.object({
  reason: RejectReasonEnum,
  notes: z.string().max(1000).optional()
})

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await req.json())

    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')

    await SocialAdminService.reject(params.id, userId, body.reason, body.notes)

    return apiSuccess({ id: params.id, status: 'DRAFT', review_state: 'REJECTED' })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
