import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { CreateLeadSchema } from '@/lib/validations/lead.validation'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import {
  encodeLeadSuccessCookieValue,
  getLeadSuccessCookieSetOptions,
  LEAD_SUCCESS_COOKIE_NAME
} from '@/lib/lead-success-cookie'
import { LeadService } from '@/services/lead.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 5, windowSeconds: 3600, routeKey: 'public:leads:create' })
    const json = await req.json()
    const input = CreateLeadSchema.parse(json)
    const result = await LeadService.create(input)

    const body = { success: true as const, data: { id: result.id } }
    const res = NextResponse.json(body, { status: 201 })
    const cookieVal = encodeLeadSuccessCookieValue(input.contact_name)
    if (cookieVal.length > 0) {
      res.cookies.set(LEAD_SUCCESS_COOKIE_NAME, cookieVal, getLeadSuccessCookieSetOptions())
    }
    return res
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

