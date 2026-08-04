import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const BodySchema = z.object({
  post_ids: z.array(z.number().int().positive()).min(1).max(200)
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json().catch(() => ({})))

    const result = await SocialAdminService.createAiBatch({
      postIds: body.post_ids
    })

    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

