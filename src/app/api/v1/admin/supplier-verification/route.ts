import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierVerificationService } from '@/services/supplier-verification.service'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const items = await SupplierVerificationService.list()
    return apiSuccess({ items })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
