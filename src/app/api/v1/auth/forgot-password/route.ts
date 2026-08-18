import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PasswordResetService } from '@/services/password-reset.service'

const BodySchema = z.object({
  email: z.string().trim().email()
})

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 5, windowSeconds: 3600, routeKey: 'auth:forgot-password' })
    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    await PasswordResetService.requestReset(body.email)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
