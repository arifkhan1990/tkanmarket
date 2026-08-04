import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminProfileService } from '@/services/admin-profile.service'

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  avatar_url: z.string().url().max(2000).optional().nullable()
})

export async function GET() {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')
    const profile = await AdminProfileService.getProfile(userId)
    return apiSuccess(profile)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = PatchSchema.parse(json)
    const profile = await AdminProfileService.updateProfile(userId, body)
    return apiSuccess(profile)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
