import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierPayoutService } from '@/services/supplier-payout.service'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const [requests, summary] = await Promise.all([
      SupplierPayoutService.listPendingAndReviewing(),
      SupplierPayoutService.getSummary()
    ])
    return apiSuccess({ requests, summary })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
