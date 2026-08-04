import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { AuthError } from '@/lib/errors'

const ParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    await SocialCredentialsService.disconnect({ credentialId: id, actorUserId: userId })
    return apiSuccess({ id, disconnected: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    const credential = await SocialCredentialsService.refreshCredential(id)
    return apiSuccess({ credentialId: credential.id, refreshed: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
