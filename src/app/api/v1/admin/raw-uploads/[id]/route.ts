import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminRawUploadService } from '@/services/admin-raw-upload.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()

    const { id: idStr } = await params
    const id = Number(idStr)
    if (!Number.isInteger(id) || id < 1) {
      return apiError('VALIDATION_ERROR', 'Invalid upload ID', 400)
    }

    const data = await AdminRawUploadService.getById(id)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}