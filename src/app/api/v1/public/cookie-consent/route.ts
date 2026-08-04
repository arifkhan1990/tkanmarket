import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { CookieConsentService } from '@/services/cookie-consent.service'

const BodySchema = z.object({
  visitor_key: z.string().trim().min(8).max(200),
  user_id: z.number().int().positive().optional().nullable(),
  preferences: z.record(z.string(), z.unknown())
})

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json()
    const body = BodySchema.parse(json)
    const row = await CookieConsentService.upsert({
      visitorKey: body.visitor_key,
      userId: body.user_id ?? null,
      preferences: body.preferences as Record<string, unknown>
    })
    return apiSuccess(row, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
