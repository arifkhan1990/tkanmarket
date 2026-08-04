import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { PasswordResetService } from '@/services/password-reset.service'

const BodySchema = z.object({
  token: z.string().trim().min(10),
  password: z.string().min(8).max(200)
})

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await PasswordResetService.completeReset(body.token, body.password)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
