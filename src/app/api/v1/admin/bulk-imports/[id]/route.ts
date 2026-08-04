import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { apiError } from '@/lib/utils/api-response'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminBulkImportService } from '@/services/admin-bulk-import.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()

    const { id: idStr } = await params
    const id = Number(idStr)
    if (!Number.isInteger(id) || id < 1) {
      return apiError('VALIDATION_ERROR', 'Invalid import job ID', 400)
    }

    const job = await AdminBulkImportService.getById(id)
    if (!job) {
      return apiError('NOT_FOUND', 'Import job not found', 404)
    }

    return apiSuccess(job)
  } catch (err) {
    const { toApiErrorResponse } = await import('@/lib/api/handle-api-error')
    return toApiErrorResponse(err)
  }
}
