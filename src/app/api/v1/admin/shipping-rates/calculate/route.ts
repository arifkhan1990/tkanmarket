import type { NextRequest } from 'next/server'

import { ShippingRateCalculateBodySchema } from '@/lib/validations/shipping-rate-calculator.validation'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { ShippingRateCalculatorService } from '@/services/shipping-rate-calculator.service'

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const json: unknown = await req.json()
    const body = ShippingRateCalculateBodySchema.parse(json)
    const data = ShippingRateCalculatorService.calculate(body)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
