import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { addAIJob } from '@/lib/queue/helpers'

const BodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200)
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json())
    const results = await Promise.allSettled(body.ids.map((id) => addAIJob(id)))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    return apiSuccess({ succeeded, failed, total: body.ids.length })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
