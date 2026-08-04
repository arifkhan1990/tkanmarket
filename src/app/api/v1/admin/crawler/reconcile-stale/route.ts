import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'

const BodySchema = z.object({
  maxAgeMinutes: z.number().int().min(0).max(10080).optional().default(120),
  /** Skip the age check and force-fail ALL RUNNING/PENDING rows immediately. */
  force: z.boolean().optional().default(false)
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = await req.json().catch(() => ({}))
    const input = BodySchema.parse(body)
    const result = await CrawlerAdminService.reconcileStaleRuns({
      maxAgeMinutes: input.maxAgeMinutes,
      force: input.force
    })
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
