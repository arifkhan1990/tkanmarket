import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const QuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE']).optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'VIDEO_PENDING']).optional(),
  search: z.string().trim().max(200).optional(),
  content_type: z.enum(['REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN']).optional(),
  fabric_id: z.coerce.number().int().positive().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const query = QuerySchema.parse({
      page,
      limit,
      platform: url.searchParams.get('platform') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      content_type: url.searchParams.get('content_type') ?? undefined,
      fabric_id: url.searchParams.get('fabric_id') ?? undefined
    })

    const result = await SocialAdminService.list({
      page: query.page,
      limit: query.limit,
      platform: query.platform,
      status: query.status,
      search: query.search,
      contentType: query.content_type,
      fabricId: query.fabric_id
    })
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
