import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'

const ParamsSchema = z.object({ runId: z.coerce.number().int().positive() })

export async function POST(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    await requireAdminSession()
    const { runId } = ParamsSchema.parse(await params)
    const result = await CrawlerAdminService.cancelRun({ runId })
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
