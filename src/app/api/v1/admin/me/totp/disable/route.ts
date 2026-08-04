import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminProfileService } from '@/services/admin-profile.service'

const BodySchema = z.object({
  password: z.string().min(1)
})

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await AdminProfileService.disableTotp(userId, body.password)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
