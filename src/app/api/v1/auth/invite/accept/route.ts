import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { AdminInviteService } from '@/services/admin-invite.service'

const BodySchema = z.object({
  token: z.string().trim().min(10),
  name: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(200)
})

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await AdminInviteService.acceptInvite({
      token: body.token,
      name: body.name,
      password: body.password
    })
    return apiSuccess({ ok: true }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
