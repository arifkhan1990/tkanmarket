import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PasswordResetService } from '@/services/password-reset.service'

const BodySchema = z.object({
  token: z.string().trim().min(10),
  password: z.string().min(8).max(200)
})

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 10, windowSeconds: 900, routeKey: 'auth:reset-password' })
    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await PasswordResetService.completeReset(body.token, body.password)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
