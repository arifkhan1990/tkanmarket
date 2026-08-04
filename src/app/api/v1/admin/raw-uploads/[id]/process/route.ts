import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminRawUploadService } from '@/services/admin-raw-upload.service'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()

    const { id: idStr } = await params
    const id = Number(idStr)
    if (!Number.isInteger(id) || id < 1) {
      return apiError('VALIDATION_ERROR', 'Invalid upload ID', 400)
    }

    const result = await AdminRawUploadService.processRows(id)
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}