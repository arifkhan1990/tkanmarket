import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiError, apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { NewsletterService } from '@/services/newsletter.service'
import { LOCALES } from '@/types/i18n.types'

export const dynamic = 'force-dynamic'

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  locale: z.enum(LOCALES).optional().default('en'),
  source: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_\-:]+$/i, 'Invalid source')
    .optional()
    .default('blog')
})

export async function POST(req: NextRequest) {
  try {
    // Tight bucket — newsletter signups are abuse-prone but the form is also
    // legitimately tapped by humans.
    await enforceRateLimit(req, {
      limit: 6,
      windowSeconds: 60,
      routeKey: 'public:newsletter-subscribe'
    })

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400)
    }

    const parsed = subscribeSchema.safeParse(raw)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid subscription payload', 400)
    }

    const result = await NewsletterService.subscribe({
      email: parsed.data.email,
      locale: parsed.data.locale,
      source: parsed.data.source
    })

    return apiSuccess({ created: result.created })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
