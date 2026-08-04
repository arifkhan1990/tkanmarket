import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const QuerySchema = z.object({
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE']).optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const query = QuerySchema.parse({
      platform: url.searchParams.get('platform') ?? undefined
    })
    const data = await SocialAdminService.getStats(query.platform)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
