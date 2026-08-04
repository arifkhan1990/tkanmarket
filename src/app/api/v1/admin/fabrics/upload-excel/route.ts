import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminBulkImportService } from '@/services/admin-bulk-import.service'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Excel file is required', statusCode: 400 } }, { status: 400 })
    }

    const filename = file instanceof File ? file.name : 'upload.xlsx'

    const allowedExtensions = ['.xlsx', '.xls']
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
    if (!allowedExtensions.includes(ext)) {
      return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Only .xlsx and .xls files are allowed', statusCode: 400 } }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'File size must be under 10MB', statusCode: 400 } }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const result = await AdminBulkImportService.createFromExcel({
      filename,
      buffer,
      adminId: Number(session.user.id ?? 0)
    })

    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
