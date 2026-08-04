import type { NextRequest } from 'next/server'

import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AiPromptLogsAdminService } from '@/services/ai-prompt-logs-admin.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id: idStr } = await params
    const id = parseInt(idStr, 10)
    if (Number.isNaN(id)) {
      return apiError('INVALID_ID', 'Invalid prompt log ID', 400)
    }

    const logItem = await AiPromptLogsAdminService.getById(id)
    if (!logItem) {
      return apiError('NOT_FOUND', 'AI prompt log not found', 404)
    }

    return apiSuccess(logItem)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
