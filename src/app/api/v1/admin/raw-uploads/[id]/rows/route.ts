import type { NextRequest } from 'next/server'

import { apiSuccess, apiError, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminRawUploadService } from '@/services/admin-raw-upload.service'

export async function GET(
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

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))

    const result = await AdminRawUploadService.getRows({ uploadId: id, page, limit })
    return apiSuccess(withPagination(result.items, result.total, page, limit))
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
