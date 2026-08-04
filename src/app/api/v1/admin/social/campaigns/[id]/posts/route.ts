import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCampaignService } from '@/services/social-campaign.service'
import { BulkIdsSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

const ParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    const body = await req.json()
    const parsed = BulkIdsSchema.parse(body)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const attached = await SocialCampaignService.addPosts({
      campaignId: id,
      postIds: parsed.post_ids,
      actorUserId: userId
    })
    return apiSuccess({ campaignId: id, attached })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
