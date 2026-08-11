import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminRawUploadService } from '@/services/admin-raw-upload.service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('VALIDATION_ERROR', 'No file provided', 400)
    }

    const fileName = file.name
    const buffer = await file.arrayBuffer()

    let fileType = 'EXCEL'
    if (fileName.endsWith('.json')) {
      fileType = 'JSON'
    } else if (fileName.endsWith('.csv')) {
      fileType = 'CSV'
    }

    const result = await AdminRawUploadService.createUpload({
      filename: fileName,
      fileType,
      buffer,
      uploadedByUserId: Number(session.user.id ?? 0)
    })

    if (result.totalRows > 0) {
      const originalFileName = `original_${fileName}`
      await AdminRawUploadService.storeOriginalFile({
        uploadId: result.id,
        buffer: Buffer.from(buffer),
        originalFileName
      })
    }

    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
