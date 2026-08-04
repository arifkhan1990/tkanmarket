import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminProfileService } from '@/services/admin-profile.service'

const BodySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/)
})

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await AdminProfileService.enableTotp(userId, body.code)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
