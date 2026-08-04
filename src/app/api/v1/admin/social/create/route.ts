import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'

const BodySchema = z.object({
  fabric_id: z.number().int().positive(),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE']),
  content_type: z.enum(['REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN']).optional()
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json().catch(() => ({})))

    const created = await SocialAdminService.createDraft({
      fabricId: body.fabric_id,
      platform: body.platform,
      contentType: body.content_type
    })

    return apiSuccess({ id: created.id }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

